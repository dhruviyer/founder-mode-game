import {Col, Table} from "react-bootstrap";
import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";

function LaborMarket() {

    const {laborData} = useContext(AppContext);

    let USDollar = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });


        return (
            <Col style={{textAlign:'left'}}>
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
                    {Object.keys(laborData).length === 0 ? <tr><td colSpan={4}><i>No Data.</i></td></tr> : 
                    Object.keys(laborData).map((key) => {
                        return (<tr key={key}>
                        <td>{key}</td>
                        <td>{laborData[key]["employer"]}</td>
                        <td>{USDollar.format(laborData[key]["salary"])}</td>
                        <td>{laborData[key]["type"]}</td>
                        </tr>);
                    })}
                </tbody>
                </Table>
            </Col>
        )
}

export default LaborMarket;