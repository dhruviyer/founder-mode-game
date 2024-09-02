import {Col, Table} from "react-bootstrap";

function MyCompany({employeeData, companyData}) {
   
    let USDollar = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    console.log(employeeData, companyData);
    
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
            <Table striped bordered hover>
            <thead>
                <tr>
                    <th>Cash</th>
                    <th>Features</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{USDollar.format(companyData["cash"])}</td>
                    <td>{Math.round(companyData["features"] * 100) / 100}</td>
                </tr>
            </tbody>
            </Table>
        </Col>
    )
}

export default MyCompany;