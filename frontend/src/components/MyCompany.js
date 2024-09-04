import {Col, Table, Row} from "react-bootstrap";

function MyCompany({employeeData, companyData}) {
   
    let USDollar = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });
    
    return (
        <Col style={{textAlign:'left'}} md={3}>
            <h1>{"name" in companyData ? companyData["name"] : "My Company"}</h1>
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
                {Object.keys(employeeData).map((key) => {
                    return (<tr key={key}>
                      <td>{key}</td>
                      <td>{employeeData[key]["priority"]}</td>
                      <td>{employeeData[key]["skill"]}</td>
                      <td>{USDollar.format(employeeData[key]["salary"])}</td>
                    </tr>);
                })}
            </tbody>
            </Table>
            <Col>
                <p><b>Valuation:</b>&nbsp;{USDollar.format(companyData["valuation"])}</p>
                <p><b>Cash:</b>&nbsp;{USDollar.format(companyData["cash"])}</p>
                <p><b>Features:</b>&nbsp;{Math.round(companyData["features"] * 100) / 100}</p>
                <p><b>ARR:</b>&nbsp;{USDollar.format(companyData["arr"])}</p>
            </Col> 
        </Col>
    )
}

export default MyCompany;