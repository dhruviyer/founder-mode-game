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

function MyCompany() {
  const { outputData, companyData } = useContext(AppContext);

  let USDollar = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <Col className="dark text-foreground text-left">
      <h1 className="mb-3">
        {"name" in companyData ? companyData["name"] : "My Company"}
      </h1>
      <Table className=" mb-5">
        <TableRow className="border-none">
          <TableCell>
            <b>Valuation:</b>
          </TableCell>
          <TableCell>{USDollar.format(companyData["valuation"])}</TableCell>
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
      </Table>
      <Table>
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
                <tr key={key}>
                  <td>{key}</td>
                  <td>{outputData[key]["priority"]}</td>
                  <td>{outputData[key]["skill"]}</td>
                  <td>{USDollar.format(outputData[key]["salary"])}</td>
                </tr>
              );
            })
          )}
        </TableBody>
      </Table>
    </Col>
  );
}

export default MyCompany;
