import { Col } from "react-bootstrap";
import { useContext } from "react";
import { AppContext } from "../contexts/AppContext.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTable } from "@/components/ui/datatable";
import { columns } from "./labor_columns";

function LaborMarket() {
  const { laborData } = useContext(AppContext);

  const data = Object.keys(laborData).map((key) => {
    return {
      name: key,
      type: laborData[key]["type"],
      employer: laborData[key]["employer"],
      salary: laborData[key]["salary"],
      skill: laborData[key]["skill"],
    };
  });

  let USDollar = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <Col className="text-foreground text-left max-h-[60vh]">
      <h1 className="mb-4 text-4xl font-semibold tracking-tight">Contacts</h1>

      <DataTable columns={columns} data={data} />
    </Col>
  );
}

export default LaborMarket;
