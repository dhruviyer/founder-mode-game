import {Col, Table} from "react-bootstrap";

function MyCompany({data}) {

    return (
        <Col style={{textAlign:'left', borderRight: "3px solid"}} md={3}>
            <h1>My Company</h1>
            <Table striped bordered hover>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Priority</th>
                </tr>
            </thead>
            <tbody>
                {Object.keys(data).map((key) => {
                    return (<tr key={key}>
                      <td>{key}</td>
                      <td>{data[key]["priority"]}</td>
                    </tr>);
                })}
            </tbody>
            </Table>
        </Col>
    )
}

export default MyCompany;