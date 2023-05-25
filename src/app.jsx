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
import "./app.scss";

import { Alert, AlertActionCloseButton, AlertVariant, AlertGroup } from "@patternfly/react-core/dist/esm/components/Alert/index.js";
import { Page, PageSection, PageSectionVariants } from "@patternfly/react-core/dist/esm/components/Page/index.js";

import EmptyState from "./emptyState.jsx";
import { getRequests, getRequest, getCAs, getCA } from './dbus.js';
import * as service from "service.js";
import { page_status } from "notifications.js";
import CertificateList from "./certificateList.jsx";

const _ = cockpit.gettext;
const CERTMONGER_SERVICE_NAME = "certmonger.service";

export class Application extends React.Component {
    constructor() {
        super();
        this.state = {
            alerts: [],
            certmongerService: undefined,
            initialPhase: true,
            cas: [],
            certs: [],
            expiredCerts: 0,
            toExpireCerts: 0,
        };

        this.onValueChanged = this.onValueChanged.bind(this);
        this.addAlert = this.addAlert.bind(this);
        this.removeAlert = this.removeAlert.bind(this);
    }

    onValueChanged(key, value) {
        this.setState({ [key]: value });
    }

    addAlert(title, message) {
        const alerts = [...this.state.alerts];
        alerts.push({ title, message });

        this.setState({ alerts });
    }

    removeAlert(index) {
        const alerts = [...this.state.alerts];
        alerts.splice(index, 1);

        this.setState({ alerts });
    }

    componentDidMount() {
        this.subscribeToCertmonger();
        this.subscribeToSystemd();
        this.updateCertmongerService();
        this.getCertificateAuthorities();
        this.getCertificates();
    }

    getCertificateAuthority(path) {
        getCA(path)
                .then(ret => {
                    this.setState((prevState) => {
                        const cas = { ...prevState.cas, [path]: ret[0] };
                        return { cas };
                    });
                })
                .catch(error => {
                    this.addAlert(_("Error: ") + error.name, error.message);
                });
    }

    getCertificateAuthorities() {
        getCAs()
                .then(paths => {
                    paths[0].forEach(path => this.getCertificateAuthority(path));
                })
                .catch(error => {
                    this.addAlert(_("Error: ") + error.name, error.message);
                });
    }

    getCertificate(path) {
        getRequest(path)
                .then(ret => {
                    this.setState((prevState) => {
                        const certs = { ...prevState.certs, [path]: ret[0] };
                        return { certs };
                    });
                })
                .catch(error => {
                    this.addAlert(_("Error: ") + error.name, error.message);
                });
    }

    getCertificates() {
        getRequests()
                .then(paths => {
                    paths[0].forEach(path => this.getCertificate(path));
                })
                .catch(error => {
                    this.addAlert(_("Error: ") + error.name, error.message);
                });
    }

    subscribeToCertmonger() {
        const systemdClient = cockpit.dbus('org.fedorahosted.certmonger', { bus: "system" });
        systemdClient.subscribe(
            { interface: 'org.freedesktop.DBus.Properties', member: 'PropertiesChanged' },
            (path, iface, signal, args) => {
                if (signal === "PropertiesChanged") {
                    if (args[0] === "org.fedorahosted.certmonger.request") {
                        const certs = { ...this.state.certs };

                        if (!certs[path]) { // new cert was added
                            this.getCertificate(path);
                        } else { // update property of existing cert
                            for (const [key, value] of Object.entries(args[1]))
                                certs[path][key] = value;

                            this.setState({ certs });
                        }
                    } else if (args[0] === "org.fedorahosted.certmonger.ca") {
                        const cas = { ...this.state.cas };

                        if (!cas[path]) { // new ca was added
                            this.getCertificateAuthority(path);
                        } else { // update property of existing CA
                            for (const [key, value] of Object.entries(args[1]))
                                cas[path][key] = value;

                            this.setState({ cas });
                        }
                    }
                }
            }
        );
    }

    subscribeToSystemd() {
        const systemdClient = cockpit.dbus('org.freedesktop.systemd1', { bus: "system" });
        systemdClient.subscribe(
            // path string source:
            // #dbus-send --system --dest=org.freedesktop.systemd1 --type=method_call --print-reply /org/freedesktop/systemd1 org.freedesktop.systemd1.Manager.ListUnits
            { interface: 'org.freedesktop.DBus.Properties', path: '/org/freedesktop/systemd1/unit/certmonger_2eservice', member: 'PropertiesChanged' },
            (path, iface, signal, args) => {
                if (args[0] === "org.freedesktop.systemd1.Unit")
                    this.updateCertmongerService();
            }
        );
    }

    updateCertmongerService() {
        const { initialPhase } = this.state;

        const certmongerService = service.proxy(CERTMONGER_SERVICE_NAME);
        certmongerService.wait(() => {
            if (initialPhase && certmongerService.state === "stopped") {
                certmongerService.start()
                        .catch(error => this.setState({ startErrorMessage: JSON.stringify(error) }));
            }
            this.setState({ initialPhase: false, certmongerService });
        });
    }

    render() {
        const { certmongerService, startErrorMessage, cas, certs, toExpireCerts, expiredCerts } = this.state;

        if (expiredCerts > 0) {
            page_status.set_own({
                type: "error",
                title: cockpit.format(cockpit.ngettext("$0 certificate has expired",
                                                       "$0 certificates have expired",
                                                       expiredCerts), expiredCerts),
                details: []
            });
        } else if (toExpireCerts > 0) {
            page_status.set_own({
                type: "warning",
                title: cockpit.format(cockpit.ngettext("$0 certificate expires soon",
                                                       "$0 certificates expire soon",
                                                       toExpireCerts), toExpireCerts),
                details: []
            });
        }

        const certificatesBody = (
            <CertificateList cas={cas} certs={certs} addAlert={this.addAlert} appOnValueChanged={this.onValueChanged} />
        );

        const emptyStateBody = (
            <EmptyState service={ certmongerService }
                serviceName={ CERTMONGER_SERVICE_NAME }
                errorMessage={ startErrorMessage }
                updateService={ () => this.updateCertmongerService() } />
        );

        const body = () => {
            if (!certmongerService || !certmongerService.exists || !certmongerService.state || certmongerService.state !== "running")
                return emptyStateBody;

            return certificatesBody;
        };

        return (
            <Page>
                <PageSection variant={PageSectionVariants.light}>
                    { body() }
                    <AlertGroup isToast>
                        {this.state.alerts.map((danger, index) => (
                            <Alert isLiveRegion
                                variant={AlertVariant.danger}
                                title={danger.title}
                                actionClose={
                                    <AlertActionCloseButton variantLabel="danger alert"
                                      onClose={() => this.removeAlert(index)} />
                                }
                                key={index}>
                                {_("Error message: ") + danger.message}
                            </Alert>
                        ))}
                    </AlertGroup>
                </PageSection>
            </Page>
        );
    }
}
