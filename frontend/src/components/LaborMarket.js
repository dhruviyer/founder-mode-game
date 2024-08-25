import {Col, Table} from "react-bootstrap";

function LaborMarket({data}) {

    let USDollar = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    return (
        <Col style={{textAlign:'left', borderRight: "3px solid"}} md={3}>
            <h1>Labor Market</h1>
            <Table striped bordered hover>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Employer</th>
                    <th>Salary</th>
                    <th>Type</th>
                </tr>
            </thead>
            <tbody>
                {Object.keys(data).map((key) => {
                    return (<tr key={key}>
                      <td>{key}</td>
                      <td>{data[key]["employer"]}</td>
                      <td>{USDollar.format(data[key]["salary"])}</td>
                      <td>{data[key]["type"]}</td>
                    </tr>);
                })}
            </tbody>
            </Table>
        </Col>
    )
}

export default LaborMarket;