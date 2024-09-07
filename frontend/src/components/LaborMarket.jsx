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

function LaborMarket() {
  const { laborData } = useContext(AppContext);

  let USDollar = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <Col className="text-foreground text-left max-h-[60vh]">
      <h1 className="mb-5 text-4xl font-extrabold tracking-tight">
        Labor Market
      </h1>

      <Table className="overflow-scroll">
        <ScrollArea className="h-[40vh]">
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Employer</TableHead>
              <TableHead className="text-right">Salary</TableHead>
              <TableHead className="text-right">Skill</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {Object.keys(laborData).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <i>No Data.</i>
                </TableCell>
              </TableRow>
            ) : (
              Object.keys(laborData).map((key) => {
                return (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell>{laborData[key]["type"]}</TableCell>
                    <TableCell>{laborData[key]["employer"]}</TableCell>
                    <TableCell className="text-right">
                      {USDollar.format(laborData[key]["salary"])}
                    </TableCell>
                    <TableCell className="text-right">
                      {laborData[key]["skill"]}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </ScrollArea>
      </Table>
    </Col>
  );
}

export default LaborMarket;
