import {Col, Table} from "react-bootstrap";

function MyCompany({data}) {
   
    let USDollar = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    return (
        <Col style={{textAlign:'left'}} md={3}>
            <h1>My Company</h1>
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
                {Object.keys(data).map((key) => {
                    return (<tr key={key}>
                      <td>{key}</td>
                      <td>{data[key]["priority"]}</td>
                      <td>{data[key]["skill"]}</td>
                      <td>{USDollar.format(data[key]["salary"])}</td>
                    </tr>);
                })}
            </tbody>
            </Table>
        </Col>
    )
}

export default MyCompany;