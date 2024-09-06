import {Col, Table} from "react-bootstrap";
import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";

function MyCompany() {

    const {outputData, companyData} = useContext(AppContext);
   
    let USDollar = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    return (
        <Col style={{textAlign:'left'}}>
            <h1 className="mb-3">{"name" in companyData ? companyData["name"] : "My Company"}</h1>
            <Table>
                <tr>
                    <td><b>Valuation:</b></td>
                    <td>{USDollar.format(companyData["valuation"])}</td>
                    <td><b>Cash:</b></td>
                    <td>{USDollar.format(companyData["cash"])}</td>
                </tr>
                <tr>
                <td><b>Features:</b></td>
                <td>{Math.round(companyData["features"] * 100) / 100}</td>
                <td><b>ARR:</b></td>
                <td>{USDollar.format(companyData["arr"])}</td>
                </tr>
            </Table>
            <Table striped bordered hover>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Priority</th>
                    <th>Skill</th>
                    <th>Salary</th>
                </tr>
            </thead>
            <tbody>
                {Object.keys(outputData).length === 0 ? <tr><td colSpan={4}><i>No Data.</i></td></tr> :
                
                Object.keys(outputData).map((key) => {
                    return (<tr key={key}>
                      <td>{key}</td>
                      <td>{outputData[key]["priority"]}</td>
                      <td>{outputData[key]["skill"]}</td>
                      <td>{USDollar.format(outputData[key]["salary"])}</td>
                    </tr>);
                })}
            </tbody>
            </Table>
        </Col>
    )
}

export default MyCompany;