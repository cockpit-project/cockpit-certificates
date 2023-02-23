/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2020 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <http://www.gnu.org/licenses/>.
 */
import cockpit from "cockpit";
import React, { useState, useEffect } from "react";

import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Checkbox } from "@patternfly/react-core/dist/esm/components/Checkbox/index.js";
import { Form, FormGroup } from "@patternfly/react-core/dist/esm/components/Form/index.js";
import { FormSelect, FormSelectOption } from "@patternfly/react-core/dist/esm/components/FormSelect/index.js";
import { Modal } from "@patternfly/react-core/dist/esm/components/Modal/index.js";
import { Radio } from "@patternfly/react-core/dist/esm/components/Radio/index.js";
import { TextArea } from "@patternfly/react-core/dist/esm/components/TextArea/index.js";
import { TextInput } from "@patternfly/react-core/dist/esm/components/TextInput/index.js";

import { addRequest, modifyRequest, resubmitRequest } from "./dbus.js";
import { ModalError } from "cockpit-components-inline-notification.jsx";
import { FileAutoComplete } from "cockpit-components-file-autocomplete.jsx";
import { getCAName } from "./helpers.js";

const _ = cockpit.gettext;

const NSSDB_PATH = "/etc/pki/nssdb";

const SetSigningParametersRow = ({ signingParameters, setSigningParameters }) => {
    return (
        <FormGroup>
            <Checkbox id='set-signing-parameters'
                      isChecked={signingParameters}
                      label={_("Set optional signing request parameters")}
                      onChange={() => setSigningParameters(!signingParameters)} />
        </FormGroup>
    );
};

const SubjectNameRow = ({ subjectName, setSubjectName }) => {
    return (
        <FormGroup fieldId="subject-name" label={_("Subject name")}>
            <TextInput value={subjectName}
                       id="subject-name"
                       onChange={value => setSubjectName(value)} />
        </FormGroup>
    );
};

const DNSNameRow = ({ dnsName, setDnsName }) => {
    return (
        <FormGroup fieldId="dns-name" label={_("DNS names")}
                   helperText={_("Comma separated list of DNS names. Example: example.com,sub.example.com")}>
            <TextArea value={dnsName}
                id="dns-name"
                onChange={value => setDnsName(value)}
                resizeOrientation='vertical' />
        </FormGroup>
    );
};

const PrincipalNameRow = ({ principalName, setPricipalName }) => {
    return (
        <FormGroup fieldId="principal-name" label={_("Principal name")}>
            <TextInput value={principalName}
                id="principal-name"
                onChange={value => setPricipalName(value)} />
        </FormGroup>
    );
};

const StorageRow = ({ storage, setStorage }) => {
    return (
        <FormGroup label={_("Certificate storage")}
                   id="storage-row"
                   isInline
                   hasNoPaddingTop>
            <Radio isChecked={storage === "nssdb"}
                   name="storage"
                   onChange={() => setStorage("nssdb")}
                   label="NSSDB"
                   id="nssdb"
                   value="nssdb" />
            <Radio isChecked={storage === "file"}
                   name="storage"
                   onChange={() => setStorage("file")}
                   label="File"
                   id="file"
                   value="file" />
        </FormGroup>
    );
};

const CAsRow = ({ ca, setCa, cas }) => {
    return (
        <FormGroup fieldId="ca" label={_("CA")}>
            <FormSelect id="ca"
                        value={ca}
                        onChange={value => setCa(value)}>
                {cas.map(ca => {
                    const nick = ca.nickname.v == "SelfSign" ? _("Self-signed") : ca.nickname.v;
                    return (
                        <FormSelectOption value={ca.nickname.v} key={ca.nickname.v}
                                          label={nick} />
                    );
                })}
            </FormSelect>
        </FormGroup>
    );
};

const NicknameRow = ({ nickname, setNickname }) => {
    return (
        <FormGroup fieldId="nickname" label={_("Nickname")}>
            <TextInput value={nickname}
                       id="nickname"
                       onChange={value => setNickname(value)}
                       aria-label={_("Nickname input text")} />
        </FormGroup>
    );
};

const CertFileRow = ({ setCertFile, mode }) => {
    return (
        <FormGroup label={_("Certificate path")}>
            <FileAutoComplete id="cert-file"
                              isOptionCreatable
                              superuser="try"
                              fileExists={mode === "import"}
                              placeholder={mode === "request" ? _("Path to store the certificate") : _("Path to an existing certificate file")}
                              onChange={value => setCertFile(value)} />
        </FormGroup>
    );
};

const KeyFileRow = ({ setKeyFile, mode }) => {
    return (
        <FormGroup label={_("Key path")}>
            <FileAutoComplete id="key-file"
                              isOptionCreatable
                              superuser="try"
                              fileExists={mode === "import"}
                              placeholder={mode === "request"
                                  ? _("Path to store the generated key or to an existing key")
                                  : _("Path to an existing key file")}
                              onChange={value => setKeyFile(value)} />
        </FormGroup>
    );
};

export const ResubmitCertificateModal = ({ onClose, cas, addAlert, cert, certPath, mode }) => {
    const [ca, setCa] = useState(getCAName(cas, cert));
    const [subjectName, setSubjectName] = useState(cert.subject && cert.subject.v);
    const [dnsName, _setDnsName] = useState(cert.hostname && cert.hostname.v.join(','));
    const [principalName, setPricipalName] = useState(cert.principal && cert.principal.v.join(','));
    const [errorName, setErrorName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const setDnsName = (value) => {
        let newValue = value.replace(/\s/g, ',');
        while (newValue.includes(",,"))
            newValue = value.replace(",,", ',');

        _setDnsName(newValue);
    };

    const onResubmit = () => {
        const casKeys = Object.keys(cas);
        let caPath;
        casKeys.forEach(key => {
            if (cas[key].nickname.v === ca)
                caPath = key;
        });

        let subjectNameParam = subjectName;
        if (subjectNameParam && !subjectNameParam.includes("="))
            subjectNameParam = "CN=" + subjectNameParam;
        let dnsNameParam;
        if (dnsName) {
            dnsNameParam = dnsName.split(',');
            dnsNameParam = dnsNameParam.filter(Boolean); // Removes empty string entries
        }

        const parameter = { ca: cockpit.variant("s", caPath) };
        parameter["template-subject"] = cockpit.variant("s", subjectNameParam || "");
        parameter["template-principal"] = cockpit.variant("as", [principalName || ""]);
        parameter["template-hostname"] = cockpit.variant("as", dnsNameParam || [""]);

        modifyRequest(certPath, parameter)
                .then(() => resubmitRequest(certPath))
                .then(onClose)
                .catch(error => {
                    setErrorName(error.name);
                    setErrorMessage(error.message);
                });
    };

    const body = (
        <Form isHorizontal>
            {cert["cert-storage"].v === "NSSDB" && <>
                <FormGroup label={_("Database path")} hasNoPaddingTop>
                    <span id="database-path-row">{ cert["cert-database"].v }</span>
                </FormGroup>
                <FormGroup label={_("Nickname")} hasNoPaddingTop>
                    <span id="nickname-row">{ cert["cert-nickname"].v }</span>
                </FormGroup>
            </>}

            {cert["cert-storage"].v === "FILE" && <>
                <FormGroup label={_("Certificate file")} hasNoPaddingTop>
                    <span id="cert-file-row">{ cert["cert-file"].v }</span>
                </FormGroup>
                <FormGroup label={_("Key file")} hasNoPaddingTop>
                    <span id="key-file-row">{ cert["key-file"].v }</span>
                </FormGroup>
            </>}

            <CAsRow ca={ca} setCa={setCa} cas={Object.values(cas)} />

            <SubjectNameRow subjectName={subjectName} setSubjectName={setSubjectName} />
            <DNSNameRow dnsName={dnsName} setDnsName={setDnsName} />
            <PrincipalNameRow principalName={principalName} setPricipalName={setPricipalName} />
        </Form>
    );

    return (
        <Modal id="resubmit-certificate-dialog"
               position="top" variant="medium"
               onClose={onClose}
               isOpen
               title={_("Resubmit Certificate")}
               footer={<>
                   {errorName && <ModalError dialogError={errorName} dialogErrorDetail={errorMessage} />}
                   <Button variant="primary" onClick={onResubmit}>
                       {_("Resubmit")}
                   </Button>
                   <Button variant="link" className="btn-cancel" onClick={onClose}>
                       {_("Cancel")}
                   </Button>
               </>}>
            {body}
        </Modal>
    );
};

function makeNickName(hostname, ca) {
    // drop the unsightly 'Z' suffix and microseconds
    const timestamp = new Date().toISOString()
            .replace(/(\.\d+)?Z$/, '');
    return hostname + '_' + ca + '_' + timestamp;
}

export const RequestCertificateModal = ({ onClose, hostname, cas, addAlert, mode }) => {
    const [_userChangedNickname, setUserChangedNickname] = useState(false);
    const [ca, _setCa] = useState(cas[Object.keys(cas)[0]] ? cas[Object.keys(cas)[0]].nickname.v : undefined);
    const [storage, setStorage] = useState(mode === "request" ? "nssdb" : "file");
    const [nickname, _setNickname] = useState(makeNickName(hostname, ca));
    const [certFile, setCertFile] = useState("");
    const [keyFile, setKeyFile] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [dnsName, _setDnsName] = useState("");
    const [principalName, setPricipalName] = useState("");
    const [signingParameters, setSigningParameters] = useState("");
    const [errorName, setErrorName] = useState();
    const [errorMessage, setErrorMessage] = useState();

    const setCa = value => {
        if (!_userChangedNickname)
            _setNickname(makeNickName(hostname, value));

        _setCa(value);
    };

    const setNickname = value => {
        setUserChangedNickname(true);
        _setNickname(value);
    };

    const setDnsName = value => {
        value = value.replace(/\s/g, ',');
        while (value.includes(",,"))
            value = value.replace(",,", ',');
        _setDnsName(value);
    };

    const onRequest = () => {
        const casKeys = Object.keys(cas);
        let caPath;
        casKeys.forEach(key => {
            if (cas[key].nickname.v === ca)
                caPath = key;
        });

        const parameter = {
            "cert-storage": cockpit.variant("s", storage),
            "key-storage": cockpit.variant("s", storage),
            ca: cockpit.variant("s", caPath),
        };

        if (storage === "nssdb") {
            parameter["cert-database"] = cockpit.variant("s", NSSDB_PATH);
            parameter["cert-nickname"] = cockpit.variant("s", nickname);
            parameter["key-database"] = cockpit.variant("s", NSSDB_PATH);
            parameter["key-nickname"] = cockpit.variant("s", nickname);
        } else { // file
            parameter["cert-file"] = cockpit.variant("s", certFile);
            parameter["key-file"] = cockpit.variant("s", keyFile);
        }

        if (signingParameters) {
            let subjectNameParam;
            if (subjectName && !subjectName.includes("="))
                subjectNameParam = "CN=" + subjectName;
            let dnsNamesParam = dnsName.split(',');
            dnsNamesParam = dnsNamesParam.filter(Boolean); // Removes empty string entries

            if (subjectName)
                parameter["template-subject"] = cockpit.variant("s", subjectNameParam);
            if (principalName)
                parameter["template-principal"] = cockpit.variant("as", [principalName]);
            if (dnsName)
                parameter["template-hostname"] = cockpit.variant("as", dnsNamesParam);
        }

        addRequest(parameter)
                .then(onClose)
                .catch(error => {
                    setErrorName(error.name);
                    setErrorMessage(error.message);
                });
    };

    const body = (
        <Form isHorizontal>
            <CAsRow ca={ca} setCa={setCa} cas={Object.values(cas)} />

            <StorageRow storage={storage} setStorage={setStorage} />
            {storage === "nssdb" &&
                <NicknameRow nickname={nickname} setNickname={setNickname} />}

            {storage === "file" && <>
                <CertFileRow setCertFile={setCertFile} mode={mode} />
                <KeyFileRow setKeyFile={setKeyFile} mode={mode} />
            </>}

            <SetSigningParametersRow signingParameters={signingParameters} setSigningParameters={setSigningParameters} />
            {signingParameters && <>
                <SubjectNameRow subjectName={subjectName} setSubjectName={setSubjectName} />
                <DNSNameRow dnsName={dnsName} setDnsName={setDnsName} />
                <PrincipalNameRow principalName={principalName} setPricipalName={setPricipalName} />
            </>}
        </Form>
    );

    return (
        <Modal id="request-certificate-dialog" onClose={onClose}
               position="top" variant="medium"
               isOpen
               title={mode === "request" ? _("Request certificate") : _("Import certificate")}
               footer={<>
                   {errorName && <ModalError dialogError={errorName} dialogErrorDetail={errorMessage} />}
                   <Button variant="primary"
                       onClick={onRequest}>
                       {mode === "request" ? _("Request") : _("Import")}
                   </Button>
                   <Button variant="link" className="btn-cancel" onClick={onClose}>
                       {_("Cancel")}
                   </Button>
               </>}>
            {body}
        </Modal>
    );
};

export const RequestCertificate = ({ cas, addAlert, mode }) => {
    const [showDialog, setShowDialog] = useState(false);
    const [hostname, setHostname] = useState("");

    useEffect(() => {
        if (mode === "request") {
            cockpit.file("/etc/hostname", { superuser: "try" }).read()
                    .done((content, tag) => setHostname(content.trim()))
                    .catch(error => console.error(error));
        }
    }, [mode]);

    const canRequest = Object.values(cas).length !== 0;

    return (
        <>
            <Button id={mode === "request" ? "request-certificate-action" : "import-certificate-action"}
                    variant="secondary"
                    isDisabled={!canRequest && hostname !== ""}
                    onClick={() => setShowDialog(true)}>
                {mode === "request" ? _("Request certificate") : _("Import certificate")}
            </Button>

            { canRequest && showDialog &&
                <RequestCertificateModal onClose={() => setShowDialog(false)} hostname={hostname} cas={cas} addAlert={addAlert} mode={mode} /> }
        </>
    );
};
