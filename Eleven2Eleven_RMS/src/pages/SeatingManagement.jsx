import React, { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
Field,
FieldLabel,
FieldContent,
} from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Plus, Edit3, Trash2, AlertCircle, Loader2 } from "lucide-react";
import {
  fetchAreas,
  createArea,
  updateArea,
  deleteArea,
  fetchTables,
  createTable,
  updateTable,
  deleteTable,
} from "@/services/SeatingManagementService";

const STATUS_OPTIONS = ["Available", "Occupied", "Reserved"];

export default function SeatingManagement() {
const [tables, setTables] = useState([]);
const [areas, setAreas] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [fetchError, setFetchError] = useState(null);

const [tableDialogOpen, setTableDialogOpen] = useState(false);
const [editingTable, setEditingTable] = useState(null);
const [tableName, setTableName] = useState("");
const [tableCode, setTableCode] = useState("");
const [tableCapacity, setTableCapacity] = useState(4);
const [tableStatus, setTableStatus] = useState("Available");
const [tableAreaId, setTableAreaId] = useState(null);

const [areaDialogOpen, setAreaDialogOpen] = useState(false);
const [editingArea, setEditingArea] = useState(null);
const [areaName, setAreaName] = useState("");

const loadData = useCallback(async () => {
setIsLoading(true);
setFetchError(null);

try {
const [areasData, tablesData] = await Promise.all([fetchAreas(), fetchTables()]);
setAreas(areasData);
setTables(tablesData);
} catch (err) {
console.error("[SeatingManagement] loadData:", err);
setFetchError(err.message || "Unable to load seating data.");
} finally {
setIsLoading(false);
}
}, []);

useEffect(() => {
loadData();
}, [loadData]);

function resetTableForm() {
setEditingTable(null);
setTableName("");
setTableCode("");
setTableCapacity(4);
setTableStatus("Available");
setTableAreaId(null);
}

function openTableAdd(areaId = null) {
resetTableForm();
setTableAreaId(areaId);
setTableDialogOpen(true);
}

function openTableEdit(table) {
setEditingTable(table);
setTableName(table.name || "");
setTableCode(table.code || `TABLE-${table.id}`);
setTableCapacity(table.capacity || 4);
setTableStatus(table.status || "Available");
setTableAreaId(table.areaId ?? table.area_id ?? null);
setTableDialogOpen(true);
}

function openAreaAdd() {
setEditingArea(null);
setAreaName("");
setAreaDialogOpen(true);
}

function openAreaEdit(area) {
setEditingArea(area);
setAreaName(area.name || "");
setAreaDialogOpen(true);
}

async function handleTableSave() {
const name = tableName.trim();
const code = tableCode.trim() || name.replace(/\s+/g, "_").toUpperCase() || `TABLE-${Date.now()}`;
const capacity = Number(tableCapacity) || 1;

if (!name || !tableAreaId) {
alert("Please provide a table name and select an area.");
return;
}

const payload = {
code,
name,
area_id: tableAreaId,
capacity,
seats: capacity,
status: tableStatus,
};

try {
if (editingTable) {
const updated = await updateTable(editingTable.id, payload);
setTables((prev) => prev.map((item) => (item.id === editingTable.id ? updated : item)));
} else {
const created = await createTable(payload);
setTables((prev) => [created, ...prev]);
}
setTableDialogOpen(false);
} catch (err) {
console.error("[SeatingManagement] table save:", err);
alert(err.message || "Failed to save table.");
}
}

async function handleTableDelete(id) {
if (!window.confirm("Delete this table?")) return;
try {
await deleteTable(id);
setTables((prev) => prev.filter((item) => item.id !== id));
} catch (err) {
console.error("[SeatingManagement] delete table:", err);
alert(err.message || "Failed to delete table.");
}
}

async function handleAreaSave() {
const name = areaName.trim();
if (!name) {
alert("Please enter area name.");
return;
}

try {
if (editingArea) {
const updated = await updateArea(editingArea.id, { name });
setAreas((prev) => prev.map((item) => (item.id === editingArea.id ? updated : item)));
} else {
const created = await createArea({ name });
setAreas((prev) => [created, ...prev]);
}
setAreaDialogOpen(false);
} catch (err) {
console.error("[SeatingManagement] area save:", err);
alert(err.message || "Failed to save area.");
}
}

async function handleAreaDelete(areaId) {
if (!window.confirm("Delete this area?")) return;
try {
await deleteArea(areaId);
setAreas((prev) => prev.filter((item) => item.id !== areaId));
setTables((prev) => prev.map((table) => (table.areaId === areaId ? { ...table, areaId: null } : table)));
} catch (err) {
console.error("[SeatingManagement] delete area:", err);
alert(err.message || "Failed to delete area.");
}
}

const groupedTables = tables.reduce((acc, table) => {
const areaKey = table.areaId ?? "unassigned";
acc[areaKey] = acc[areaKey] || [];
acc[areaKey].push(table);
return acc;
}, {});

return (
<main className="p-8 flex-1 bg-gray-100 min-h-screen w-full h-full">
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
<div>
<h1 className="text-3xl font-bold">Seating Management</h1>
<p className="text-sm text-gray-500 mt-1">{tables.length} tables · {areas.length} areas</p>
</div>
<div className="flex flex-wrap gap-2">
<Button variant="outline" size="sm" onClick={loadData}>Refresh</Button>
<Button variant="outline" size="sm" onClick={openAreaAdd}>Manage Areas</Button>
<Button onClick={() => openTableAdd(null)} className="flex items-center gap-2">
<Plus /> Add Table
</Button>
</div>
</div>

{isLoading ? (
<div className="flex flex-col items-center justify-center py-16 text-gray-500">
<Loader2 className="w-8 h-8 animate-spin" />
<p className="mt-3">Loading seating data...</p>
</div>
) : fetchError ? (
<div className="flex flex-col items-center justify-center py-16 text-red-600 gap-3">
<AlertCircle className="w-10 h-10" />
<p className="text-lg font-semibold">Failed to load seating data</p>
<p className="text-sm text-red-500">{fetchError}</p>
<Button variant="outline" onClick={loadData}>Retry</Button>
</div>
) : tables.length === 0 ? (
<div className="text-sm text-gray-500">No tables created yet. Please add a table or area first.</div>
) : (
<div className="space-y-6">
{areas.map((area) => {
const items = groupedTables[area.id] || [];
return (
<section key={`area-${area.id}`} className="bg-white p-4 rounded-md shadow-sm border">
<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
<div>
<h2 className="text-xl font-semibold">{area.name}</h2>
<p className="text-sm text-gray-500">{items.length} tables</p>
</div>
<div className="flex flex-wrap gap-2">
<Button variant="ghost" size="sm" className="text-green-600 border border-green-600" onClick={() => openTableAdd(area.id)}>
<Plus className="w-4 h-4" /> Add Table
</Button>
<Button variant="outline" size="sm" onClick={() => openAreaEdit(area)}>Edit</Button>
<Button variant="destructive" size="sm" onClick={() => handleAreaDelete(area.id)}>Delete</Button>
</div>
</div>

{items.length === 0 ? (
<div className="text-sm text-gray-500">No tables in this area.</div>
) : (
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
{items.map((table) => (
<Card key={table.id} className="shadow-sm">
<CardHeader>
<div className="flex justify-between items-start">
<div>
<CardTitle className="text-lg">{table.name}</CardTitle>
<div className="text-xs text-muted-foreground">ID: #{table.id}</div>
</div>
<div className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-700">{table.status}</div>
</div>
</CardHeader>
<CardContent>
<div className="text-sm text-gray-700">Seats: <strong>{table.capacity}</strong></div>
</CardContent>
<CardFooter className="flex justify-end gap-2">
<Button variant="outline" size="sm" onClick={() => openTableEdit(table)}>
<Edit3 className="w-4 h-4" /> Edit
</Button>
<Button variant="destructive" size="sm" onClick={() => handleTableDelete(table.id)}>
<Trash2 className="w-4 h-4" /> Delete
</Button>
</CardFooter>
</Card>
))}
</div>
)}
</section>
);
})}

<section className="bg-white p-4 rounded-md shadow-sm border">
<div className="flex justify-between items-center mb-4">
<div>
<h2 className="text-xl font-semibold">Unassigned</h2>
<p className="text-sm text-gray-500">{(groupedTables.unassigned || []).length} tables</p>
</div>
<Button variant="ghost" size="sm" onClick={() => openTableAdd(null)}>
<Plus className="w-4 h-4" /> Add Table
</Button>
</div>
{(!groupedTables.unassigned || groupedTables.unassigned.length === 0) ? (
<div className="text-sm text-gray-500">No unassigned tables.</div>
) : (
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
{groupedTables.unassigned.map((table) => (
<Card key={table.id} className="shadow-sm">
<CardHeader>
<div className="flex justify-between items-start">
<div>
<CardTitle className="text-lg">{table.name}</CardTitle>
<div className="text-xs text-muted-foreground">ID: #{table.id}</div>
</div>
<div className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-700">{table.status}</div>
</div>
</CardHeader>
<CardContent>
<div className="text-sm text-gray-700">Seats: <strong>{table.capacity}</strong></div>
</CardContent>
<CardFooter className="flex justify-end gap-2">
<Button variant="outline" size="sm" onClick={() => openTableEdit(table)}>
<Edit3 className="w-4 h-4" /> Edit
</Button>
<Button variant="destructive" size="sm" onClick={() => handleTableDelete(table.id)}>
<Trash2 className="w-4 h-4" /> Delete
</Button>
</CardFooter>
</Card>
))}
</div>
)}
</section>
</div>
)}

<Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
<DialogContent>
<DialogHeader>
<DialogTitle>{editingTable ? "Edit Table" : "Add Table"}</DialogTitle>
</DialogHeader>

<div className="grid gap-3 mt-2">
<Field>
<FieldLabel>Name</FieldLabel>
<FieldContent>
<Input value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="Table name" />
</FieldContent>
</Field>

<Field>
<FieldLabel>Code</FieldLabel>
<FieldContent>
<Input value={tableCode} onChange={(e) => setTableCode(e.target.value)} placeholder="Table code" />
</FieldContent>
</Field>

<Field>
<FieldLabel>Capacity</FieldLabel>
<FieldContent>
<Input type="number" min="1" value={tableCapacity} onChange={(e) => setTableCapacity(Number(e.target.value))} />
</FieldContent>
</Field>

<Field>
<FieldLabel>Status</FieldLabel>
<FieldContent>
<Select value={tableStatus} onChange={(e) => setTableStatus(e.target.value)}>
{STATUS_OPTIONS.map((option) => (
<option key={option} value={option}>{option}</option>
))}
</Select>
</FieldContent>
</Field>

<Field>
<FieldLabel>Area</FieldLabel>
<FieldContent>
<Select value={tableAreaId ?? ""} onChange={(e) => setTableAreaId(e.target.value === "" ? null : Number(e.target.value))}>
<option value="">Select area</option>
{areas.map((area) => (
<option key={area.id} value={area.id}>{area.name}</option>
))}
</Select>
</FieldContent>
</Field>
</div>

<DialogFooter>
<div className="flex gap-2 w-full justify-end">
<Button variant="ghost" onClick={() => setTableDialogOpen(false)}>Cancel</Button>
<Button onClick={handleTableSave}>{editingTable ? "Save" : "Create"}</Button>
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