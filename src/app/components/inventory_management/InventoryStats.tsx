import { Package, AlertTriangle, AlertCircle } from "lucide-react";

interface InventoryStatsProps {
    totalItems: number;
    freshItems: number;
    expiredItems: number;
}

export function InventoryStats({ totalItems, freshItems, expiredItems }: InventoryStatsProps) {
    return (
        <div className="grid grid-cols-3 gap-3 px-6 py-4">
            <div className="bg-[#1a4d3d]/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-5 shadow-2xl relative group overflow-hidden">
                <div className="text-2xl font-black text-white mb-1">{totalItems}</div>
                <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">總數量</div>
            </div>

            <div className="bg-[#1a4d3d]/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_12px_#00ff88] animate-pulse" />
                <div className="text-2xl font-black text-[#00ff88] mb-1">{freshItems}</div>
                <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">保鮮中</div>
            </div>

            <div className={`backdrop-blur-md border rounded-[2rem] p-5 shadow-2xl relative overflow-hidden group transition-all ${expiredItems > 0 ? "bg-red-500/20 border-red-500/50 animate-pulse" : "bg-white/5 border-white/10 opacity-40"}`}>
                <div className={`text-2xl font-black mb-1 ${expiredItems > 0 ? "text-red-500" : "text-gray-500"}`}>{expiredItems}</div>
                <div className={`text-[9px] font-black uppercase tracking-widest ${expiredItems > 0 ? "text-red-500" : "text-gray-500"}`}>已過期</div>
            </div>
        </div>
    );
}
