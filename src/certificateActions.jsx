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
import React, { useState } from "react";

import "./certificateActions.css";

import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Checkbox } from "@patternfly/react-core/dist/esm/components/Checkbox/index.js";
import { Dropdown, DropdownItem, KebabToggle } from "@patternfly/react-core/dist/esm/components/Dropdown/index.js";
import { Form, FormGroup } from "@patternfly/react-core/dist/esm/components/Form/index.js";
import { Modal } from "@patternfly/react-core/dist/esm/components/Modal/index.js";

import { ResubmitCertificateModal } from './requestCertificate.jsx';
import { removeRequest } from "./dbus.js";

const _ = cockpit.gettext;

export const RemoveModal = ({ onClose, certs, cert, certPath, addAlert, appOnValueChanged, idPrefix }) => {
    const [deleteFiles, setDeleteFiles] = useState(false);

    const onRemoveResponse = () => {
        delete certs[certPath];

        appOnValueChanged("certs, certs");
        onClose();
    };

    const onRemove = () => {
        if (deleteFiles) {
            cockpit.file(cert["key-file"].v, { superuser: "try" }).replace(null) // delete key file
                    .then(() => cockpit.file(cert["cert-file"].v, { superuser: "try" }).replace(null)) // delete cert file
                    .then(() => removeRequest(certPath))
                    // There is no dbus signal for cert removal, so we have to update UI manually
                    .then(() => onRemoveResponse())
                    .catch(error => {
                        addAlert(_("Error: ") + (error.name || error.problem), error.message);
                        onClose();
                    });
        } else {
            removeRequest(certPath)
                    // There is no dbus signal for cert removal, so we have to update UI manually
                    .then(() => onRemoveResponse())
                    .catch(error => {
                        addAlert(_("Error: ") + error.name, error.message);
                        onClose();
                    });
        }
    };

    const title = _("Remove certificate: ") + (cert["cert-storage"].v === "FILE" ? cert.nickname.v : cert["cert-nickname"].v);

    const fileCertBody = (
        <Form isHorizontal>
            <FormGroup label={_("Certificate file")} hasNoPaddingTop>
                <samp id={idPrefix + "cert-file"}>
                    {cert["cert-file"].v}
                </samp>
            </FormGroup>

            <FormGroup label={_("Key file")} hasNoPaddingTop>
                <samp id={idPrefix + "key-file"}>
                    {cert["key-file"].v}
                </samp>
            </FormGroup>
        </Form>
    );

    const nssdbCertBody = (
        <Form isHorizontal>
            <FormGroup label={_("NSSDB path")} hasNoPaddingTop>
                <samp id={idPrefix + "cert-database"}>
                    {cert["cert-database"].v}
                </samp>
            </FormGroup>

            <FormGroup label={_("Nickname")} hasNoPaddingTop>
                <samp id={idPrefix + "cert-nickname"}>
                    {cert["cert-nickname"].v}
                </samp>
            </FormGroup>
        </Form>
    );

    const body = (
        <>
            { cert["cert-storage"].v === "FILE" ? fileCertBody : nssdbCertBody }
            { cert["key-file"] && cert["cert-file"] && cert["key-file"].v && cert["cert-file"].v && (
                <Checkbox id={idPrefix + "-delete-files"}
                      className="checkbox-delete-files"
                      isChecked={deleteFiles}
                      label={_("Also delete certificate and key files")}
                      onChange={e => setDeleteFiles(!deleteFiles)} />
            )}
        </>
    );

    return (
        <Modal id={idPrefix + "-remove-dialog"}
               position="top" variant="medium"
               onClose={onClose}
               isOpen
               title={title}
               footer={<>
                   <Button variant="danger" onClick={onRemove}>
                       { deleteFiles ? _("Remove and delete") : _("Remove") }
                   </Button>
                   <Button variant="link" className="btn-cancel" onClick={onClose}>
                       {_("Cancel")}
                   </Button>
               </>}>
            {body}
        </Modal>
    );
};

export const CertificateActions = ({ cas, certs, cert, certPath, addAlert, appOnValueChanged, idPrefix }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [showResubmitModal, setShowResubmitModal] = useState(false);

    const dropdownItems = [
        <DropdownItem
            key={`${idPrefix}-resubmit`}
            id={`${idPrefix}-resubmit`}
            onClick={() => setShowResubmitModal(true)}>
            {_("Resubmit")}
        </DropdownItem>,
        <DropdownItem className="pf-m-danger"
            key={`${idPrefix}-remove`}
            id={`${idPrefix}-remove`}
            onClick={() => setShowRemoveModal(true)}>
            {_("Remove")}
        </DropdownItem>,
    ];

    return (
        <>
            <Dropdown onSelect={() => setDropdownOpen(!dropdownOpen)}
                id={`${idPrefix}-action-kebab`}
                toggle={
                    <KebabToggle key={`${idPrefix}-action-kebab-toggle`}
                        onToggle={() => setDropdownOpen(!dropdownOpen)} />
                }
                isOpen={dropdownOpen}
                position="right"
                dropdownItems={dropdownItems}
                isPlain />

            {showRemoveModal &&
                <RemoveModal onClose={() => setShowRemoveModal(false)}
                    certs={certs}
                    cert={cert}
                    certPath={certPath}
                    addAlert={addAlert}
                    appOnValueChanged={appOnValueChanged}
                    idPrefix={idPrefix} />}
            {showResubmitModal &&
                <ResubmitCertificateModal onClose={() => setShowResubmitModal(false)}
                    cas={cas}
                    addAlert={addAlert}
                    cert={cert}
                    certPath={certPath} />}
        </>
    );
};
