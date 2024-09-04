import {Form,
    InputGroup, 
    Col, 
    Button,
    Stack
    } from "react-bootstrap";
import { Floppy, PersonCircle, ArrowClockwise, Building, Globe2} from "react-bootstrap-icons"
import {useState} from "react";

function Settings({username, setUsername, company, setCompany, sendMessage}) {

    const [tempUsername, setTempUsername] = useState(username);
    const [tempCompany, setTempCompany] = useState(company);

    const [savedText, setSavedText] = useState("");

    const onSave = async function() {
        setCompany(tempCompany);
        setUsername(tempUsername);
        setSavedText("Saved!");
        sendMessage("register "+tempUsername+" "+tempCompany, tempUsername);
        await new Promise( res => setTimeout(res, 3000) );
        setSavedText("");
    }

    const onReset = () => {
        setTempCompany(company);
        setTempUsername(username);
    }

    return (
        <Col style={{textAlign:'left', borderRight: "3px solid"}} md={3}>
        <h1>Settings</h1>
            <InputGroup className="mb-3 mt-3">
                <InputGroup.Text id="basic-addon1"><PersonCircle/></InputGroup.Text>
                <Form.Control
                    placeholder="username"
                    aria-label="Message"
                    id="message"
                    value={tempUsername}
                    onChange={(event) => { setTempUsername(event.target.value) }}
                />
            </InputGroup>
            <InputGroup className="mb-3">
                <InputGroup.Text id="basic-addon1"><Building/></InputGroup.Text>
                <Form.Control
                    placeholder="company"
                    aria-label="Message"
                    id="message"
                    value={tempCompany.toUpperCase()}
                    onChange={(event) => { setTempCompany(event.target.value.toUpperCase()) }}
                />
            </InputGroup>
            <Stack direction="horizontal" gap={3}>
                <p className="ms-auto" style={{color: "green"}}><i>{savedText}</i></p>
            <Button onClick={onSave} className="mlr-5" variant="primary"><Floppy/></Button>
            <Button onClick={onReset} variant="danger"><ArrowClockwise/></Button>
            </Stack>
           
        </Col>
    )
}

export default Settings;