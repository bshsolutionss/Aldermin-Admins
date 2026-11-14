import {RegistryPanel,StockPanel} from "@/components/modules/operations/OperationsPanel";
export default function Page(){return <div className="space-y-12"><RegistryPanel resource="items" title="Inventory Item Registry"/><StockPanel/></div>;}
