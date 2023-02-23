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
import React from "react";

import { Badge } from "@patternfly/react-core/dist/esm/components/Badge/index.js";
import { Checkbox } from "@patternfly/react-core/dist/esm/components/Checkbox/index.js";
import { DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm } from "@patternfly/react-core/dist/esm/components/DescriptionList/index.js";
import { Flex, FlexItem } from "@patternfly/react-core/dist/esm/layouts/Flex/index.js";
import { Tooltip, TooltipPosition } from "@patternfly/react-core/dist/esm/components/Tooltip/index.js";
import { InfoAltIcon, ExclamationTriangleIcon, TimesCircleIcon } from '@patternfly/react-icons';

import { CertificateActions } from "./certificateActions.jsx";
import { RequestCertificate } from './requestCertificate.jsx';
import { ListingPanel } from "cockpit-components-listing-panel.jsx";
import { ListingTable } from "cockpit-components-table.jsx";
import { modifyRequest } from "./dbus.js";
import { certificateStates } from "./states.js";
import { getCAName } from "./helpers.js";

const _ = cockpit.gettext;

const dateLocale = () => cockpit.language.replace('_', '-');

function prettyTime(unixTime) {
    return new Date(Number(unixTime) * 1000).toLocaleString(dateLocale());
}

function getExpirationTime(cert) {
    if (cert.autorenew && cert.autorenew.v) {
        return _("Auto-renews before ") + prettyTime(cert["not-valid-after"].v).toLowerCase();
    } else {
        const expiry = new Date(Number(cert["not-valid-after"].v) * 1000);
        const now = new Date();
        const diffSeconds = (expiry - now) / 1000;
        const diffDays = diffSeconds / 86400;

        if (diffSeconds < 0) { // Expired
            if (diffDays > -28) { // Expired X days ago
                return (
                    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <TimesCircleIcon className="ct-icon-times-circle" />
                        <FlexItem>{_("Expired ") + expiry.toLocaleDateString(dateLocale())}</FlexItem>
                    </Flex>
                );
            }
            return (
                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                    <TimesCircleIcon className="ct-icon-times-circle" />
                    <FlexItem>{_("Expired on ") + prettyTime(cert["not-valid-after"].v)}</FlexItem>
                </Flex>
            );
        }

        // Expires
        if (diffDays < 28) { // Expires in X days
            return (
                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                    <ExclamationTriangleIcon className="ct-icon-exclamation-triangle" />
                    <FlexItem>{_("Expires ") + expiry.toLocaleDateString(dateLocale())}</FlexItem>
                </Flex>
            );
        }
        return _("Expires on ") + prettyTime(cert["not-valid-after"].v);
    }
}

const generalDetails = ({ idPrefix, cas, cert, certPath, onAutorenewChanged }) => {
    const caName = getCAName(cas, cert);

    return (<Flex justifyContent={{ default: "justifyContentCenter" }}>
        <Flex direction={{ default:"column" }} flex={{ default: 'flex_1' }}>
            <DescriptionList isHorizontal>
                {cert.status && cert.status.v && <DescriptionListGroup>
                    <DescriptionListTerm>{_("Status")}</DescriptionListTerm>
                    <DescriptionListDescription id={`${idPrefix}-general-status`}>
                        {cert.stuck.v && (
                            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <ExclamationTriangleIcon className="ct-icon-exclamation-triangle" />
                                <span id={`${idPrefix}-general-stuck`}>{_("Stuck: ")}</span>
                            </Flex>
                        )}
                        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                            <FlexItem>
                                {cert.status.v.includes('_')
                                    ? cert.status.v
                                    : cert.status.v.charAt(0) + cert.status.v.slice(1).toLowerCase()}
                            </FlexItem>
                            <Tooltip position={TooltipPosition.top}
                                entryDelay={0}
                                content={certificateStates[cert.status.v]}>
                                <span className="info-circle">
                                    <InfoAltIcon />
                                </span>
                            </Tooltip>
                        </Flex>
                    </DescriptionListDescription>
                </DescriptionListGroup>}

                {cert.ca && cert.ca.v && <DescriptionListGroup>
                    <DescriptionListTerm>{_("Certificate authority")}</DescriptionListTerm>
                    <DescriptionListDescription id={`${idPrefix}-general-ca`}>{caName == "SelfSign" ? _("Self-signed") : caName}</DescriptionListDescription>
                </DescriptionListGroup>}

                {cert["not-valid-after"] && cert["not-valid-after"].v !== 0 && <DescriptionListGroup>
                    <DescriptionListTerm>
                        {_("Valid")}
                    </DescriptionListTerm>
                    <DescriptionListDescription id={`${idPrefix}-general-validity`}>
                        {prettyTime(cert["not-valid-before"].v) +
                        _(" to ") + prettyTime(cert["not-valid-after"].v)}
                    </DescriptionListDescription>
                </DescriptionListGroup>}

                {cert.autorenew && <DescriptionListGroup>
                    <DescriptionListTerm>
                        {_("Auto-renewal")}
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                        <Checkbox id={`${idPrefix}-general-autorenewal`}
                                  isChecked={cert.autorenew.v}
                                  label={_("Renew before expiration")}
                                  onChange={() => onAutorenewChanged(cert, certPath)} />
                    </DescriptionListDescription>
                </DescriptionListGroup>}
            </DescriptionList>
        </Flex>
        <Flex direction={{ default:"column" }} flex={{ default: 'flex_1' }}>
            <DescriptionList isHorizontal>
                {cert.subject && cert.subject.v && <DescriptionListGroup>
                    <DescriptionListTerm>
                        {_("Subject name")}
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                        <span id={`${idPrefix}-general-subject`}>{cert.subject.v}</span>
                    </DescriptionListDescription>
                </DescriptionListGroup>}

                {cert.principal && cert.principal.v.length > 0 && <DescriptionListGroup>
                    <DescriptionListTerm>
                        {_("Principal name")}
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                        <span id={`${idPrefix}-general-principal`}>{cert.principal.v.join(", ")}</span>
                    </DescriptionListDescription>
                </DescriptionListGroup>}

                {cert.hostname && cert.hostname.v.length > 0 && <DescriptionListGroup>
                    <DescriptionListTerm>
                        {_("DNS name")}
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                        <span id={`${idPrefix}-general-dns`}>{cert.hostname.v.join(", ")}</span>
                    </DescriptionListDescription>
                </DescriptionListGroup>}
            </DescriptionList>
        </Flex>
    </Flex>);
};

const keyDetails = ({ idPrefix, cert }) => (
    <DescriptionList isHorizontal>
        {cert["key-nickname"] && cert["key-nickname"].v && <DescriptionListGroup>
            <DescriptionListTerm>{_("Nickname")}</DescriptionListTerm>
            <span id={`${idPrefix}-key-nickname`}>{cert["key-nickname"].v}</span>
        </DescriptionListGroup>}
        {cert["key-type"] && cert["key-type"].v && <DescriptionListGroup>
            <DescriptionListTerm>{_("Type")}</DescriptionListTerm>
            <span id={`${idPrefix}-key-type`}>{cert["key-type"].v}</span>
        </DescriptionListGroup>}
        {cert["key-token"] && cert["key-token"].v && <DescriptionListGroup>
            <DescriptionListTerm>{_("Token")}</DescriptionListTerm>
            <span id={`${idPrefix}-key-token`}>{cert["key-token"].v}</span>
        </DescriptionListGroup>}
        {cert["key-storage"] && cert["key-storage"].v && <DescriptionListGroup>
            <DescriptionListTerm>{_("Storage")}</DescriptionListTerm>
            <span id={`${idPrefix}-key-storage`}>{cert["key-storage"].v}</span>
        </DescriptionListGroup>}
        {((cert["key-database"] && cert["key-database"].v) || (cert["key-file"] && cert["key-file"].v)) && <DescriptionListGroup>
            <DescriptionListTerm>{_("Location")}</DescriptionListTerm>
            {cert["key-storage"].v === "FILE"
                ? <span id={`${idPrefix}-key-location`}>{cert["key-file"].v}</span>
                : <span id={`${idPrefix}-key-location`}>{cert["key-database"].v}</span>
            }
        </DescriptionListGroup>}
    </DescriptionList>
);

const certDetails = ({ idPrefix, cert }) => (
    <DescriptionList isHorizontal>
        {cert["cert-nickname"] && cert["cert-nickname"].v && <DescriptionListGroup>
            <DescriptionListTerm>{_("Nickname")}</DescriptionListTerm>
            <span id={`${idPrefix}-cert-nickname`}>{cert["cert-nickname"].v}</span>
        </DescriptionListGroup>}
        {cert["cert-token"] && cert["cert-token"].v && <DescriptionListGroup>
            <DescriptionListTerm>{_("Token")}</DescriptionListTerm>
            <span id={`${idPrefix}-cert-token`}>{cert["cert-token"].v}</span>
        </DescriptionListGroup>}
        {cert["cert-storage"] && cert["cert-storage"].v && <DescriptionListGroup>
            <DescriptionListTerm>{_("Storage")}</DescriptionListTerm>
            <span id={`${idPrefix}-cert-storage`}>{cert["cert-storage"].v}</span>
        </DescriptionListGroup>}
        {((cert["cert-database"] && cert["cert-database"].v) || (cert["cert-file"] && cert["cert-file"].v)) && <DescriptionListGroup>
            <DescriptionListTerm>{_("Location")}</DescriptionListTerm>
            {cert["cert-storage"].v === "FILE"
                ? <span id={`${idPrefix}-cert-location`}>{cert["cert-file"].v}</span>
                : <span id={`${idPrefix}-cert-location`}>{cert["cert-database"].v}</span>
            }
        </DescriptionListGroup>}
    </DescriptionList>
);

class CertificateList extends React.Component {
    constructor() {
        super();
        this.state = {
            expanded: [],
            activeTabKey: 0,
        };

        this.toggle = this.toggle.bind(this);
        this.onValueChanged = this.onValueChanged.bind(this);
        this.onAutorenewChanged = this.onAutorenewChanged.bind(this);
    }

    onAutorenewChanged(cert, certPath) {
        const { addAlert } = this.props;
        const updates = { autorenew: cockpit.variant("b", !cert.autorenew.v) };

        modifyRequest(certPath, updates)
                .catch(error => addAlert(error.name, error.message));
    }

    toggle(certId) {
        this.setState(oldState => {
            const newExpanded = oldState.expanded;
            const certIndex = newExpanded.findIndex(e => e === certId);

            if (certIndex < 0)
                newExpanded.push(certId);
            else
                newExpanded.splice(certIndex, 1);
            return { expanded:  newExpanded };
        });
    }

    onValueChanged(key, value) {
        this.setState({ [key]: value });
    }

    render() {
        const { addAlert, certs, cas, appOnValueChanged } = this.props;

        const items = Object.entries(certs).map(([certPath, cert], idx) => {
            const idPrefix = cockpit.format("certificate-$0", idx);
            const onAutorenewChanged = this.onAutorenewChanged;

            const tabRenderers = [
                {
                    name: _("General"),
                    renderer: generalDetails,
                    data: { idPrefix, cas, cert, certPath, onAutorenewChanged }
                },
                {
                    name: _("Key"),
                    renderer: keyDetails,
                    data: { idPrefix, cert }
                },
                {
                    name: _("Certificate"),
                    renderer: certDetails,
                    data: { idPrefix, cert }
                },
            ];

            const expandedContent = (<ListingPanel colSpan='4' tabRenderers={tabRenderers} />);
            let caTitle = getCAName(cas, cert);
            if (caTitle !== "SelfSign") {
                caTitle = (
                    <Badge id={`${idPrefix}-ca`}>
                        {caTitle}
                    </Badge>
                );
            } else {
                caTitle = (
                    <span id={`${idPrefix}-ca`}>
                        {_("Self-signed")}
                    </span>
                );
            }

            return {
                columns: [
                    {
                        title: (cert["cert-nickname"] && cert["cert-nickname"].v)
                            ? <span id={`${idPrefix}-name`}>{cert["cert-nickname"].v}</span>
                            : <span id={`${idPrefix}-name`}>
                                {cert.nickname && cert.nickname.v + _(" (Request ID)")}
                            </span>
                    },
                    {
                        title: cert["not-valid-after"] && cert["not-valid-after"].v !== 0 &&
                        <span id={`${idPrefix}-validity`}>{getExpirationTime(cert)}</span>
                    },
                    { title: cert.ca && cert.ca.v && caTitle },
                    {
                        title: <CertificateActions cas={cas}
                                 certs={certs}
                                 cert={cert}
                                 certPath={certPath}
                                 addAlert={addAlert}
                                 appOnValueChanged={appOnValueChanged}
                                 idPrefix={idPrefix} />
                    },
                ],
                rowId: idPrefix,
                props: { key: idPrefix },
                initiallyExpanded: false,
                expandedContent: expandedContent,
            };
        });

        const actions = (<>
            <RequestCertificate cas={cas} addAlert={addAlert} mode="request" />
            <RequestCertificate cas={cas} addAlert={addAlert} mode="import" />
        </>);

        return (
            <ListingTable caption={_("Certificates")}
                isEmptyStateInTable
                variant='compact'
                emptyCaption={_("No certificate is tracked on this host")}
                columns={[
                    { title: _("Name") },
                    { title: _("Validity") },
                    { title: _("Certificate Authority") },
                    { title: _("Actions") },
                ]}
                actions={actions}
                rows={items} />
        );
    }
}

export default CertificateList;
