import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { ordersApi } from "../api/client";
import AdminPageShell from "../components/AdminPageShell";

function formatRs(amount) {
	const value = Number(amount) || 0;
	return "Rs " + value.toFixed(2);
}

function formatDateTime(value) {
	if (!value) return "-";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "-";
	return d.toLocaleString();
}

function normalizeStatus(status) {
	const s = String(status || "Pending").trim();
	if (!s) return "Pending";
	const lower = s.toLowerCase();
	if (lower === "completed") return "Approved";
	if (lower === "cancelled") return "Rejected";
	if (lower === "approved") return "Approved";
	if (lower === "rejected") return "Rejected";
	if (lower === "pending") return "Pending";
	return s;
}
//oderss
function statusBadgeClass(status) {
	const s = normalizeStatus(status).toLowerCase();
	if (s === "approved" || s === "completed") return "badge badge-approved";
	if (s === "rejected" || s === "cancelled") return "badge badge-rejected";
	return "badge badge-pending";
}

function polarToCartesian(cx, cy, r, angleDegrees) {
	const angleRadians = ((angleDegrees - 90) * Math.PI) / 180.0;
	return {
		x: cx + r * Math.cos(angleRadians),
		y: cy + r * Math.sin(angleRadians),
	};
}

function describeArc(cx, cy, r, startAngle, endAngle) {
	const start = polarToCartesian(cx, cy, r, endAngle);
	const end = polarToCartesian(cx, cy, r, startAngle);
	const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
	return ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y, "L", cx, cy, "Z"].join(" ");
}

function PieChart({ data }) {
	const size = 180;
	const radius = 78;
	const cx = size / 2;
	const cy = size / 2;

	const cleanData = (Array.isArray(data) ? data : []).filter((s) => Number(s?.value || 0) > 0);
	const total = cleanData.reduce((sum, s) => sum + Number(s.value || 0), 0);
	if (!total) {
		return <p className="empty">No data for pie chart.</p>;
	}

	const colors = [
		"var(--primary)",
		"var(--secondary)",
		"var(--warning)",
		"var(--danger)",
		"var(--accent)",
		"var(--text-muted)",
	];

	if (cleanData.length === 1) {
		const slice = cleanData[0];
		const value = Number(slice.value || 0);
		const color = "var(--primary)";
		return (
			<div className="chart-pie">
				<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Pie chart">
					<circle cx={cx} cy={cy} r={radius} style={{ fill: color }} />
				</svg>

				<div className="chart-legend">
					<div className="legend-row">
						<span className="legend-dot" style={{ background: color }} aria-hidden="true" />
						<span className="legend-name">{slice.name}</span>
						<span className="legend-value">100.0%</span>
					</div>
					<div className="legend-row">
						<span className="legend-dot" style={{ background: "transparent" }} aria-hidden="true" />
						<span className="legend-name">Total</span>
						<span className="legend-value">{value}</span>
					</div>
				</div>
			</div>
		);
	}

	let currentAngle = 0;
	const slices = cleanData.map((slice, idx) => {
		const value = Number(slice.value || 0);
		const angle = (value / total) * 360;
		const start = currentAngle;
		const end = currentAngle + angle;
		currentAngle = end;
		return {
			...slice,
			path: describeArc(cx, cy, radius, start, end),
			color: colors[idx % colors.length],
			percent: (value / total) * 100,
		};
	});

	return (
		<div className="chart-pie">
			<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Pie chart">
				{slices.map((s) => (
					<path key={s.name} d={s.path} style={{ fill: s.color }} />
				))}
			</svg>

			<div className="chart-legend">
				{slices.map((s) => (
					<div key={s.name} className="legend-row">
						<span className="legend-dot" style={{ background: s.color }} aria-hidden="true" />
						<span className="legend-name">{s.name}</span>
						<span className="legend-value">{s.percent.toFixed(1)}%</span>
					</div>
				))}
			</div>
		</div>
	);
}

function BarChart({ data }) {
	const list = Array.isArray(data) ? data : [];
	const max = Math.max(1, ...list.map((d) => Number(d.value || 0)));
	if (!list.length) {
		return <p className="empty">No data for bar chart.</p>;
	}

	return (
		<div className="chart-bars">
			{list.map((d) => {
				const value = Number(d.value || 0);
				const pct = Math.max(0, Math.min(100, (value / max) * 100));
				return (
					<div key={d.name} className="bar-row">
						<div className="bar-label" title={d.name}>
							{d.name}
						</div>
						<div className="bar-track" aria-hidden="true">
							<div className="bar-fill" style={{ width: `${pct}%` }} />
						</div>
						<div className="bar-value">{formatRs(value)}</div>
					</div>
				);
			})}
		</div>
	);
}

export default function OrdersPage() {
	const chartsRef = useRef(null);
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [savingId, setSavingId] = useState(null);
	const [downloadingCharts, setDownloadingCharts] = useState(false);
	const [downloadingSummary, setDownloadingSummary] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [editing, setEditing] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [form, setForm] = useState({
		userId: "",
		customerName: "",
		medicineName: "",
		quantity: "1",
		price: "0",
		status: "Approved",
	});

	const fetchOrders = async () => {
		try {
			setLoading(true);
			setError("");
			setSuccess("");
			const data = await ordersApi.getAll();
			const list = Array.isArray(data) ? data : [];
			list.sort((a, b) => {
				const ta = new Date(a?.createdAt || 0).getTime();
				const tb = new Date(b?.createdAt || 0).getTime();
				return tb - ta;
			});
			setOrders(list);
		} catch (err) {
			setError(err.message || "Failed to fetch orders.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchOrders();
	}, []);

	const computedTotal = useMemo(() => {
		const qty = Math.max(0, Number(form.quantity || 0));
		const price = Math.max(0, Number(form.price || 0));
		const total = qty * price;
		if (!Number.isFinite(total)) return 0;
		return Number(total.toFixed(2));
	}, [form.quantity, form.price]);

	const stats = useMemo(() => {
		const list = Array.isArray(orders) ? orders : [];
		const total = list.length;
		let pending = 0;
		let approved = 0;
		let rejected = 0;

		for (const o of list) {
			const s = normalizeStatus(o?.status).toLowerCase();
			if (s === "approved" || s === "completed") approved += 1;
			else if (s === "rejected" || s === "cancelled") rejected += 1;
			else pending += 1;
		}

		const revenue = list
			.filter((o) => {
				const s = normalizeStatus(o?.status).toLowerCase();
				return s === "approved" || s === "completed";
			})
			.reduce((sum, o) => sum + Number(o?.totalPrice || 0), 0);

		return { total, pending, approved, rejected, revenue };
	}, [orders]);

	const charts = useMemo(() => {
		const list = Array.isArray(orders) ? orders : [];

		let pending = 0;
		let approved = 0;
		let rejected = 0;
		const revenueByMedicine = new Map();

		for (const o of list) {
			const status = normalizeStatus(o?.status).toLowerCase();
			if (status === "approved" || status === "completed") {
				approved += 1;
				const name = String(o?.medicineName || "Unknown").trim() || "Unknown";
				const value = Number(o?.totalPrice || 0);
				revenueByMedicine.set(name, (revenueByMedicine.get(name) || 0) + (Number.isFinite(value) ? value : 0));
			} else if (status === "rejected" || status === "cancelled") {
				rejected += 1;
			} else {
				pending += 1;
			}
		}

		const statusData = [
			{ name: "Pending", value: pending },
			{ name: "Approved", value: approved },
			{ name: "Rejected", value: rejected },
		];

		const topMedicinesByRevenue = Array.from(revenueByMedicine.entries())
			.map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
			.sort((a, b) => b.value - a.value)
			.slice(0, 7);

		return { statusData, topMedicinesByRevenue };
	}, [orders]);

	const updateStatus = async (order, nextStatus) => {
		const id = String(order?._id || "");
		if (!id) return;

		try {
			setSavingId(id);
			setError("");
			setSuccess("");

			const quantity = Number(order?.quantity || 0);
			const price = Number(order?.price || 0);
			const total = Number(order?.totalPrice || quantity * price || 0);

			await ordersApi.update(id, {
				userId: order?.userId ?? null,
				customerName: order?.customerName,
				medicineName: order?.medicineName,
				quantity,
				price,
				totalPrice: Number(total.toFixed(2)),
				status: nextStatus,
			});

			setSuccess(`Order status updated to ${nextStatus}.`);
			fetchOrders();
		} catch (err) {
			setError(err.message || "Failed to update order.");
		} finally {
			setSavingId(null);
		}
	};

	const deleteOrder = async (order) => {
		const id = String(order?._id || "");
		if (!id) return;
		if (!window.confirm("Delete this order? This cannot be undone.")) return;

		try {
			setSavingId(id);
			setError("");
			setSuccess("");
			await ordersApi.delete(id);
			setSuccess("Order deleted.");
			fetchOrders();
		} catch (err) {
			setError(err.message || "Failed to delete order.");
		} finally {
			setSavingId(null);
		}
	};

	const resetForm = () => {
		setForm({
			userId: "",
			customerName: "",
			medicineName: "",
			quantity: "1",
			price: "0",
			status: "Approved",
		});
		setEditing(null);
		setShowForm(false);
	};

	const openCreateForm = () => {
		setError("");
		setSuccess("");
		setEditing(null);
		setForm({
			userId: "",
			customerName: "",
			medicineName: "",
			quantity: "1",
			price: "0",
			status: "Approved",
		});
		setShowForm(true);
	};

	const openEditForm = (order) => {
		if (!order?._id) return;
		setError("");
		setSuccess("");
		setEditing(order);
		setForm({
			userId: String(order?.userId || ""),
			customerName: String(order?.customerName || ""),
			medicineName: String(order?.medicineName || ""),
			quantity: String(order?.quantity ?? ""),
			price: String(order?.price ?? ""),
			status: normalizeStatus(order?.status),
		});
		setShowForm(true);
	};

	const handleFormChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const submitOrder = async (e) => {
		e.preventDefault();
		try {
			setSubmitting(true);
			setError("");
			setSuccess("");

			const customerName = String(form.customerName || "").trim();
			const medicineName = String(form.medicineName || "").trim();
			const qty = Math.max(1, parseInt(form.quantity, 10) || 0);
			const price = Math.max(0, parseFloat(form.price) || 0);
			const totalPrice = Number((qty * price).toFixed(2));
			const status = normalizeStatus(form.status);
			const userIdRaw = String(form.userId || "").trim();
			const userId = userIdRaw ? userIdRaw : null;

			if (!customerName) throw new Error("Customer name is required.");
			if (!medicineName) throw new Error("Medicine name is required.");
			if (qty <= 0) throw new Error("Quantity must be at least 1.");
			if (!Number.isFinite(price)) throw new Error("Price is invalid.");
			if (!Number.isFinite(totalPrice)) throw new Error("Total price is invalid.");

			const payload = {
				userId,
				customerName,
				medicineName,
				quantity: qty,
				price,
				totalPrice,
				status,
			};

			if (editing?._id) {
				await ordersApi.update(editing._id, payload);
				setSuccess("Order updated.");
			} else {
				await ordersApi.create(payload);
				setSuccess("Order created.");
			}

			resetForm();
			fetchOrders();
		} catch (err) {
			setError(err.message || "Failed to save order.");
		} finally {
			setSubmitting(false);
		}
	};

	const downloadBlob = (blob, filename) => {
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
		window.URL.revokeObjectURL(url);
	};

	const downloadCharts = async () => {
		const node = chartsRef.current;
		if (!node) {
			setError("Charts section not found.");
			return;
		}
		try {
			setDownloadingCharts(true);
			setError("");
			setSuccess("");

			const canvas = await html2canvas(node, {
				scale: 2,
				useCORS: true,
			});

			await new Promise((resolve, reject) => {
				canvas.toBlob(
					(blob) => {
						if (!blob) return reject(new Error("Failed to export chart image."));
						const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
						downloadBlob(blob, `orders-charts-${stamp}.png`);
						resolve();
					},
					"image/png",
					1
				);
			});

			setSuccess("Charts downloaded.");
		} catch (err) {
			setError(err.message || "Failed to download charts.");
		} finally {
			setDownloadingCharts(false);
		}
	};

	const csvValue = (value) => {
		if (value === null || value === undefined) return "";
		const s = String(value);
		if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
		return s;
	};

	const downloadSummaryReport = async () => {
		try {
			setDownloadingSummary(true);
			setError("");
			setSuccess("");

			const generatedAt = new Date().toISOString();
			const lines = [];
			lines.push(["Medix Orders Summary Report"].map(csvValue).join(","));
			lines.push(["Generated At", generatedAt].map(csvValue).join(","));
			lines.push("");
			lines.push(["Metric", "Value"].map(csvValue).join(","));
			lines.push(["Total Orders", stats.total].map(csvValue).join(","));
			lines.push(["Pending", stats.pending].map(csvValue).join(","));
			lines.push(["Approved", stats.approved].map(csvValue).join(","));
			lines.push(["Rejected", stats.rejected].map(csvValue).join(","));
			lines.push(["Approved Revenue", Number(stats.revenue || 0).toFixed(2)].map(csvValue).join(","));
			lines.push("");
			lines.push(["Status", "Count"].map(csvValue).join(","));
			for (const row of charts.statusData) {
				lines.push([row.name, row.value].map(csvValue).join(","));
			}
			lines.push("");
			lines.push(["Top Medicines (Approved Revenue)", "Revenue"].map(csvValue).join(","));
			if (charts.topMedicinesByRevenue.length === 0) {
				lines.push(["(none)", "0.00"].map(csvValue).join(","));
			} else {
				for (const row of charts.topMedicinesByRevenue) {
					lines.push([row.name, Number(row.value || 0).toFixed(2)].map(csvValue).join(","));
				}
			}

			const csv = lines.join("\n");
			const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
			const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
			downloadBlob(blob, `orders-summary-${stamp}.csv`);
			setSuccess("Summary report downloaded.");
		} catch (err) {
			setError(err.message || "Failed to download summary report.");
		} finally {
			setDownloadingSummary(false);
		}
	};

	return (
		<AdminPageShell breadcrumb="Orders">
		<div className="orders-page ph-admin-orders">
			<div className="page-header">
				<div>
					<h1>Orders</h1>
					<p className="page-subtitle">Review customer orders and approve or reject them.</p>
				</div>

				<div className="page-actions">
					<button
						type="button"
						className="btn btn-secondary"
						onClick={downloadCharts}
						disabled={loading || downloadingCharts}
					>
						{downloadingCharts ? "Downloading..." : "Download Charts"}
					</button>
					<button
						type="button"
						className="btn btn-secondary"
						onClick={downloadSummaryReport}
						disabled={loading || downloadingSummary}
					>
						{downloadingSummary ? "Downloading..." : "Download Summary"}
					</button>
					<button type="button" className="btn btn-primary" onClick={openCreateForm} disabled={loading}>
						Add Order
					</button>
				</div>
			</div>

			{error && <div className="alert alert-error">{error}</div>}
			{success && <div className="alert alert-success">{success}</div>}

			{showForm && (
				<div className="card form-card">
					<h2>{editing ? "Update Order" : "Create Order"}</h2>
					<form onSubmit={submitOrder}>
						<div className="form-row">
							<label htmlFor="userId">User ID (optional)</label>
							<input
								id="userId"
								name="userId"
								type="text"
								value={form.userId}
								onChange={handleFormChange}
								placeholder="e.g. 65f..."
								disabled={submitting}
							/>
						</div>

						<div className="form-row two-col">
							<div>
								<label htmlFor="customerName">Customer Name</label>
								<input
									id="customerName"
									name="customerName"
									type="text"
									value={form.customerName}
									onChange={handleFormChange}
									required
									disabled={submitting}
								/>
							</div>

							<div>
								<label htmlFor="medicineName">Medicine Name</label>
								<input
									id="medicineName"
									name="medicineName"
									type="text"
									value={form.medicineName}
									onChange={handleFormChange}
									required
									disabled={submitting}
								/>
							</div>
						</div>

						<div className="form-row two-col">
							<div>
								<label htmlFor="quantity">Quantity</label>
								<input
									id="quantity"
									name="quantity"
									type="number"
									min="1"
									value={form.quantity}
									onChange={handleFormChange}
									required
									disabled={submitting}
								/>
							</div>

							<div>
								<label htmlFor="price">Price</label>
								<input
									id="price"
									name="price"
									type="number"
									min="0"
									step="0.01"
									value={form.price}
									onChange={handleFormChange}
									required
									disabled={submitting}
								/>
							</div>
						</div>

						<div className="form-row two-col">
							<div>
								<label htmlFor="totalPrice">Total Price</label>
								<input id="totalPrice" type="text" value={formatRs(computedTotal)} readOnly disabled />
							</div>
							<div>
								<label htmlFor="status">Status</label>
								<select
									id="status"
									name="status"
									value={form.status}
									onChange={handleFormChange}
									disabled={submitting}
								>
									<option value="Pending">Pending</option>
									<option value="Approved">Approved</option>
									<option value="Rejected">Rejected</option>
								</select>
							</div>
						</div>

						<div className="form-actions">
							<button type="submit" className="btn btn-primary" disabled={submitting}>
								{submitting ? "Saving..." : editing ? "Update Order" : "Create Order"}
							</button>
							<button type="button" className="btn btn-secondary" onClick={resetForm} disabled={submitting}>
								Cancel
							</button>
						</div>
					</form>
				</div>
			)}

			<div className="card">
				<h2>Summary</h2>
				<div className="analysis-grid">
					<div className="analysis-stat stat-total">
						<div className="analysis-value">{stats.total}</div>
						<div className="analysis-label">Total Orders</div>
					</div>
					<div className="analysis-stat stat-pending">
						<div className="analysis-value">{stats.pending}</div>
						<div className="analysis-label">Pending</div>
					</div>
					<div className="analysis-stat stat-approved">
						<div className="analysis-value">{stats.approved}</div>
						<div className="analysis-label">Approved</div>
					</div>
					<div className="analysis-stat stat-rejected">
						<div className="analysis-value">{stats.rejected}</div>
						<div className="analysis-label">Rejected</div>
					</div>
					<div className="analysis-stat stat-revenue">
						<div className="analysis-value">{formatRs(stats.revenue)}</div>
						<div className="analysis-label">Approved Revenue</div>
					</div>
				</div>
			</div>

			<div className="card" ref={chartsRef}>
				<h2>Charts</h2>
				<div className="charts-grid">
					<div className="chart-card">
						<h3 className="chart-title">Order Status Distribution</h3>
						<PieChart data={charts.statusData} />
					</div>

					<div className="chart-card">
						<h3 className="chart-title">Top Medicines (Approved Revenue)</h3>
						<BarChart data={charts.topMedicinesByRevenue} />
					</div>
				</div>
			</div>

			<div className="card table-card">
				<h2>All Orders</h2>

				{loading ? (
					<div className="loading">Loading orders...</div>
				) : orders.length === 0 ? (
					<div className="empty">No orders found.</div>
				) : (
					<div className="table-wrap">
						<table className="data-table">
							<thead>
								<tr>
									<th>Customer</th>
									<th>Medicine</th>
									<th>Qty</th>
									<th>Price</th>
									<th>Total</th>
									<th>Status</th>
									<th>Created</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{orders.map((order) => {
									const id = String(order?._id || "");
									const status = normalizeStatus(order?.status);
									const isSaving = savingId === id;
									return (
										<tr key={id}>
											<td>{order?.customerName || "-"}</td>
											<td>{order?.medicineName || "-"}</td>
											<td>{Number(order?.quantity || 0)}</td>
											<td>{formatRs(order?.price)}</td>
											<td>{formatRs(order?.totalPrice)}</td>
											<td>
												<span className={statusBadgeClass(status)}>{status}</span>
											</td>
											<td>{formatDateTime(order?.createdAt)}</td>
											<td>
												<div className="row-actions">
													<button
														type="button"
														className="btn btn-sm btn-secondary"
														onClick={() => openEditForm(order)}
														disabled={isSaving}
													>
														Edit
													</button>
													<button
														type="button"
														className="btn btn-sm btn-primary"
														onClick={() => updateStatus(order, "Approved")}
														disabled={isSaving || normalizeStatus(order?.status) === "Approved"}
													>
														Approve
													</button>
													<button
														type="button"
														className="btn btn-sm btn-secondary"
														onClick={() => updateStatus(order, "Pending")}
														disabled={isSaving || normalizeStatus(order?.status) === "Pending"}
													>
														Set Pending
													</button>
													<button
														type="button"
														className="btn btn-sm btn-danger"
														onClick={() => updateStatus(order, "Rejected")}
														disabled={isSaving || normalizeStatus(order?.status) === "Rejected"}
													>
														Reject
													</button>
													<button
														type="button"
														className="btn btn-sm btn-secondary"
														onClick={() => deleteOrder(order)}
														disabled={isSaving}
													>
														Delete
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
		</AdminPageShell>
	);
}