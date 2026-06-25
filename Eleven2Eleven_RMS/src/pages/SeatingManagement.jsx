import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
    Field, 
    FieldLabel, 
    FieldContent 
} from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Plus, Edit3, Trash2 } from "lucide-react";
import { 
    getTables, 
    addTable, 
    updateTable as apiUpdateTable, 
    deleteTable as apiDeleteTable,
    getAreas,
    addArea,
    updateArea as apiUpdateArea,
    deleteArea as apiDeleteArea
} from "../data_access/api";

export default function SeatingManagement() {
	const [tables, setTables] = useState([]);
	const [loading, setLoading] = useState(false);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [name, setName] = useState("");
	const [capacity, setCapacity] = useState(4);
	const [status, setStatus] = useState("Available");
	const [areaId, setAreaId] = useState(null);

	// Areas
	const [areas, setAreas] = useState([]);
	const [areaDialogOpen, setAreaDialogOpen] = useState(false);
	const [editingArea, setEditingArea] = useState(null);
	const [areaName, setAreaName] = useState("");

	useEffect(() => {
		loadTables();
		loadAreas();
	}, []);

	async function loadAreas() {
		try {
			const list = await getAreas();
			const normalized = (list || []).map(a => ({ id: a.id, name: a.name || a.title || `Area ${a.id}` }));
			normalized.sort((a, b) => (a.id - b.id));
			setAreas(normalized);
		} catch (err) {
			console.error("Failed to load areas", err);
		}
	}

	function openAreaAdd() {
		setEditingArea(null);
		setAreaName("");
		setAreaDialogOpen(true);
	}

	function openAreaEdit(a) {
		setEditingArea(a);
		setAreaName(a.name || "");
		setAreaDialogOpen(true);
	}

	async function handleAreaSave() {
		const payload = { name: (areaName || '').trim() };
		if (!payload.name) {
			alert('Please enter area name');
			return;
		}
		try {
			if (editingArea) {
				await apiUpdateArea(editingArea.id, payload);
				setAreas(prev => prev.map(x => x.id === editingArea.id ? { ...x, ...payload } : x));
			} else {
				const created = await addArea(payload);
				setAreas(prev => [{ id: created.id, name: created.name || payload.name }, ...prev]);
			}
			setAreaDialogOpen(false);
		} catch (err) {
			console.error(err);
			alert('Failed to save area.');
		}
	}

	async function loadTables() {
		setLoading(true);
		try {
			const list = await getTables();
			const normalized = (list || []).map((t) => ({
				id: t.id,
				name: t.name || t.table_name || `Table ${t.id}`,
				capacity: Number(t.capacity || t.seats || 4),
				status: t.status || "Available",
				note: t.note || "",
				area_id: t.area_id ?? t.area ?? null,
			}));
			// sort by id desc
			normalized.sort((a, b) => (a.id < b.id ? 1 : -1));
			setTables(normalized);
		} catch (err) {
			console.error(err);
			alert("Failed to load tables.");
		} finally {
			setLoading(false);
		}
	}

	function openAdd() {
		setEditing(null);
		setName("");
		setCapacity(4);
		setStatus("Available");
		setAreaId(null);
		setDialogOpen(true);
	}

	function openAddForArea(aid) {
		setEditing(null);
		setName("");
		setCapacity(4);
		setStatus("Available");
		setAreaId(aid ?? null);
		setDialogOpen(true);
	}

	function openEdit(t) {
		setEditing(t);
		setName(t.name || "");
		setCapacity(t.capacity || 4);
		setStatus(t.status || "Available");
		setAreaId(t.area_id ?? t.area ?? null);
		setDialogOpen(true);
	}

	async function handleSave() {
		const payload = { name: name.trim() || `Table`, capacity: Number(capacity) || 1, status };
		if (areaId !== null && areaId !== undefined && areaId !== "") payload.area_id = areaId;
		try {
			if (editing) {
				await apiUpdateTable(editing.id, payload);
				setTables((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...payload } : p)));
			} else {
				const created = await addTable(payload);
				const item = { id: created.id, name: created.name || payload.name, capacity: Number(created.capacity || payload.capacity), status: created.status || payload.status, area_id: created.area_id ?? payload.area_id ?? null };
				setTables((prev) => [item, ...prev]);
			}
			setDialogOpen(false);
		} catch (err) {
			console.error(err);
			alert("Failed to save table.");
		}
	}

	async function handleDelete(id) {
		if (!confirm("Delete this table?")) return;
		try {
			await apiDeleteTable(id);
			setTables((prev) => prev.filter((t) => t.id !== id));
		} catch (err) {
			console.error(err);
			alert("Failed to delete table.");
		}
	}

	return (
		<main className="p-8 flex-1 bg-gray-100 min-h-screen w-full h-full">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold">Seating Management</h1>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={loadTables}>Refresh</Button>
					<Button variant="outline" size="sm" onClick={() => { setEditingArea(null); setAreaName(''); setAreaDialogOpen(true); }}>Manage Areas</Button>
					<Button onClick={openAdd} className="flex items-center gap-2">
						<Plus /> Add Table
					</Button>
				</div>
			</div>

			{loading ? (
				<div className="text-sm text-gray-500">Loading tables...</div>
			) : tables.length === 0 ? (
				<div className="text-sm text-gray-500">No tables defined yet.</div>
			) : (
				<div className="space-y-6">
					{/* Areas list */}
					{(() => {
						// build a map of tables by area id (null = unassigned)
						const map = {};
						const pushTo = (key, item) => { map[key] = map[key] || []; map[key].push(item); };
						tables.forEach(t => pushTo(t.area_id ?? t.area ?? 'unassigned', t));

						// render areas in order, then unassigned
						const areaNodes = [];
						areas.forEach(a => {
							const key = a.id;
							const items = map[key] || [];
							areaNodes.push(
								<section key={`area-${key}`} className="bg-white p-4 rounded-md shadow-sm border">
									<div className="flex justify-between items-center mb-3">
										<h2 className="text-xl font-semibold">{a.name}</h2>
										<div className="flex gap-2">
											<Button variant="ghost" size="sm" className="text-green-600 border border-green-600" onClick={() => openAddForArea(a.id)}>
												<Plus className="w-4 h-4" /> Add Table
											</Button>
											<Button variant="outline" size="sm" onClick={() => { setEditingArea(a); setAreaName(a.name); setAreaDialogOpen(true); }}>Edit</Button>
											<Button variant="destructive" size="sm" onClick={async () => { if (!confirm('Delete this area?')) return; try { await apiDeleteArea(a.id); setAreas(prev => prev.filter(x => x.id !== a.id)); setTables(prev => prev.map(t => t.area_id === a.id ? { ...t, area_id: null } : t)); } catch (err) { console.error(err); alert('Failed to delete area.'); } }}>Delete</Button>
										</div>
									</div>

									{items.length === 0 ? (
										<div className="text-sm text-gray-500">No tables in this area.</div>
									) : (
										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
											{items.map(t => (
												<Card key={t.id} className="shadow-sm">
													<CardHeader>
														<div className="flex justify-between items-start">
															<div>
																<CardTitle className="text-lg">{t.name}</CardTitle>
																<div className="text-xs text-muted-foreground">ID: #{t.id}</div>
															</div>
															<div className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-700">{t.status}</div>
														</div>
													</CardHeader>
													<CardContent>
														<div className="text-sm text-gray-700">Seats: <strong>{t.capacity}</strong></div>
													</CardContent>
													<CardFooter className="flex justify-end gap-2">
														<Button variant="outline" size="sm" onClick={() => openEdit(t)}>
															<Edit3 className="w-4 h-4" /> Edit
														</Button>
														<Button variant="destructive" size="sm" onClick={() => handleDelete(t.id)}>
															<Trash2 className="w-4 h-4" /> Delete
														</Button>
													</CardFooter>
												</Card>
											))}
										</div>
									)}
								</section>
							);
						});

						// unassigned
						const unassigned = map['unassigned'] || [];
						areaNodes.push(
							<section key="area-unassigned" className="bg-white p-4 rounded-md shadow-sm border">
								<div className="flex justify-between items-center mb-3">
									<h2 className="text-xl font-semibold">Unassigned</h2>
									<div>
										<Button variant="ghost" size="sm" onClick={() => openAddForArea(null)}>
											<Plus className="w-4 h-4" /> Add Table
										</Button>
									</div>
								</div>
								{unassigned.length === 0 ? (
									<div className="text-sm text-gray-500">No unassigned tables.</div>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
										{unassigned.map(t => (
											<Card key={t.id} className="shadow-sm">
												<CardHeader>
													<div className="flex justify-between items-start">
														<div>
															<CardTitle className="text-lg">{t.name}</CardTitle>
															<div className="text-xs text-muted-foreground">ID: #{t.id}</div>
														</div>
														<div className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-700">{t.status}</div>
													</div>
												</CardHeader>
												<CardContent>
													<div className="text-sm text-gray-700">Seats: <strong>{t.capacity}</strong></div>
												</CardContent>
												<CardFooter className="flex justify-end gap-2">
													<Button variant="outline" size="sm" onClick={() => openEdit(t)}>
														<Edit3 className="w-4 h-4" /> Edit
													</Button>
													<Button variant="destructive" size="sm" onClick={() => handleDelete(t.id)}>
														<Trash2 className="w-4 h-4" /> Delete
													</Button>
												</CardFooter>
											</Card>
										))}
									</div>
								)}
							</section>
						);

						return areaNodes;
					})()}
				</div>
			)}

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{editing ? "Edit Table" : "Add Table"}</DialogTitle>
					</DialogHeader>

					<div className="grid gap-3 mt-2">
						<Field>
							<FieldLabel>Name</FieldLabel>
							<FieldContent>
								<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Table name" />
							</FieldContent>
						</Field>

						<Field>
							<FieldLabel>Capacity</FieldLabel>
							<FieldContent>
								<Input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
							</FieldContent>
						</Field>

						<Field>
							<FieldLabel>Area</FieldLabel>
							<FieldContent>
								<Select value={areaId ?? ""} onChange={(e) => setAreaId(e.target.value === "" ? null : (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)))}>
									<option value="">(None)</option>
									{areas.map(a => (
										<option key={a.id} value={a.id}>{a.name}</option>
									))}
								</Select>
							</FieldContent>
						</Field>
					</div>

					<DialogFooter>
						<div className="flex gap-2 w-full justify-end">
							<Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
							<Button onClick={handleSave}>{editing ? "Save" : "Create"}</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={areaDialogOpen} onOpenChange={setAreaDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{editingArea ? "Edit Area" : "Add Area"}</DialogTitle>
					</DialogHeader>

					<div className="grid gap-3 mt-2">
						<Field>
							<FieldLabel>Area name</FieldLabel>
							<FieldContent>
								<Input value={areaName} onChange={(e) => setAreaName(e.target.value)} placeholder="Area name" />
							</FieldContent>
						</Field>
					</div>

					<DialogFooter>
						<div className="flex gap-2 w-full justify-end">
							<Button variant="ghost" onClick={() => setAreaDialogOpen(false)}>Cancel</Button>
							<Button onClick={handleAreaSave}>{editingArea ? "Save" : "Create"}</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	);
}

