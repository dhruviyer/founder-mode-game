import { Col } from "react-bootstrap";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContext } from "react";
import { AppContext } from "../contexts/AppContext.jsx";
import { ScrollArea } from "@/components/ui/scroll-area";

function MyCompany() {
  const { outputData, companyData } = useContext(AppContext);

  let USDollar = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <Col className="text-foreground text-left">
      <h1 className="mb-3 text-4xl font-extrabold tracking-tight">
        {"name" in companyData ? companyData["name"] : "My Company"}
      </h1>
      <div className="">
        <div className="border-[3px] rounded-3xl mb-2">
          <Table className="text-foreground">
            <TableBody>
              <TableRow className="border-none ">
                <TableCell>
                  <b>Valuation:</b>
                </TableCell>
                <TableCell>
                  {USDollar.format(companyData["valuation"])}
                </TableCell>
                <TableCell>
                  <b>Cash:</b>
                </TableCell>
                <TableCell>{USDollar.format(companyData["cash"])}</TableCell>
              </TableRow>
              <TableRow className="border-none">
                <TableCell>
                  <b>Features:</b>
                </TableCell>
                <TableCell>
                  {Math.round(companyData["features"] * 100) / 100}
                </TableCell>
                <TableCell>
                  <b>ARR:</b>
                </TableCell>
                <TableCell>{USDollar.format(companyData["arr"])}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <Table className="overflow-scroll">
          <ScrollArea className="h-[60vh]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead>Salary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(outputData).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <i>No Data.</i>
                  </TableCell>
                </TableRow>
              ) : (
                Object.keys(outputData).map((key) => {
                  return (
                    <TableRow key={key}>
                      <TableCell>{key}</TableCell>
                      <TableCell>{outputData[key]["priority"]}</TableCell>
                      <TableCell>{outputData[key]["skill"]}</TableCell>
                      <TableCell>
                        {USDollar.format(outputData[key]["salary"])}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </ScrollArea>
        </Table>
      </div>
    </Col>
  );
}

export default MyCompany;
