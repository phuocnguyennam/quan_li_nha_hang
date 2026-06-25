import { useState, useEffect } from "react";
import { fetchRoles } from "@/services/Usermanagementservice";
import { Separator } from "@radix-ui/react-separator";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import RoleCombobox from "./RoleCombobox";
import {
    ShieldUser,
    UserRound,
    UserRoundPen,
} from "lucide-react";

export default function UserLayout({ user, onUpdate, onDelete }) {
    let icon = <></>
    if (!user) return <Card className="w-full p-6" />

    // role_id dạng string để khớp với RoleCombobox (vd: "2")
    // user.role_id từ normalizeUser đã được String() rồi
    const [editing,  setEditing]  = useState(false);
    const [fullName, setFullName] = useState(user.name     || "");
    const [username, setUsername] = useState(user.username || "");
    const [email,    setEmail]    = useState(user.email    || "");
    const [password, setPassword] = useState("");
    const [roleId,   setRoleId]   = useState(user.role_id ? String(user.role_id) : "");
    const [roles,    setRoles]    = useState([]);

    useEffect(() => {
        let mounted = true
        fetchRoles()
            .then(list => { if (mounted) setRoles(list) })
            .catch(err => console.error('Failed to load roles', err))
        return () => { mounted = false }
    }, [])

    // Hiển thị role name từ role_id
    const roleName = (() => {
        const found = roles.find(r => r.id === String(user.role_id))
        return found ? found.name : (user.role || '')
    })()

    // Icon theo role name
    switch (roleName) {
        case 'Admin':   icon = <ShieldUser    className="!w-8 !h-8 text-gray-600 self-center" />; break;
        case 'Manager': icon = <UserRoundPen  className="!w-8 !h-8 text-gray-600 self-center" />; break;
        default:        icon = <UserRound     className="!w-8 !h-8 text-gray-600 self-center" />; break;
    }

    async function handleSave() {
        if (!username.trim() || !fullName.trim() || !email.trim()) {
            alert("Vui lòng điền username, họ tên và email.");
            return;
        }

        // Gửi đúng field name mà backend/controller nhận
        const payload = {
            name:      username.trim(),
            full_name: fullName.trim(),
            email:     email.trim(),
            role_id:   roleId ? Number(roleId) : undefined,
        };

        // Gửi password plaintext — backend tự hash bằng passwordUtils
        if (password.trim()) {
            payload.password = password.trim();
        }

        if (typeof onUpdate === "function") {
            await onUpdate(user.id, payload);
        }
        setPassword("");
        setEditing(false);
    }

    function handleCancel() {
        setFullName(user.name     || "");
        setUsername(user.username || "");
        setEmail(user.email       || "");
        setRoleId(user.role_id ? String(user.role_id) : "");
        setPassword("");
        setEditing(false);
    }

    function handleDelete() {
        if (!confirm(`Xóa user "${user.name}"? Hành động không thể hoàn tác.`)) return;
        if (typeof onDelete === "function") onDelete(user.id);
    }

    return (
        <Card className="w-full p-6 mb-3">
            <div className="flex flex-row gap-4">
                {icon}
                <Separator orientation="vertical" className="mx-4 border border-black" />
                <div className="flex flex-row self-start justify-between flex-1">
                    <div className="flex flex-col items-start gap-1">
                        {editing ? (
                            <>
                                <Input
                                    className="w-100 text-sm text-gray-600"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                <Input
                                    className="w-100 text-xl font-medium text-gray-800"
                                    placeholder="Họ tên đầy đủ"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                                <Input
                                    className="w-100 text-sm text-gray-600"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Input
                                    className="w-100 text-sm text-gray-600"
                                    placeholder="Mật khẩu mới (để trống = giữ nguyên)"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                {/* value là role_id string, onChange trả về role_id string */}
                                <RoleCombobox
                                    className="w-100"
                                    value={roleId}
                                    onChange={(v) => setRoleId(v || "")}
                                />
                            </>
                        ) : (
                            <>
                                <div className="text-xl font-medium text-gray-800">{user.name}</div>
                                <div className="text-sm text-gray-500">@{user.username}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                <div className="text-md font-normal text-gray-800">
                                    Role: {roleName}
                                </div>
                            </>
                        )}
                    </div>

                    {editing ? (
                        <div className="flex items-center gap-2">
                            <Button className="bg-red-100"     variant="destructive" onClick={handleDelete}>Xóa</Button>
                            <Button className="bg-emerald-100" variant="primary"     onClick={handleSave}>Lưu</Button>
                            <Button className="bg-gray-100"    variant="ghost"       onClick={handleCancel}>Hủy</Button>
                        </div>
                    ) : (
                        <Button
                            className="w-30 bg-gray-200 hover:bg-gray-300 self-center"
                            variant="secondary"
                            onClick={() => setEditing(true)}
                        >
                            Sửa
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    )
}