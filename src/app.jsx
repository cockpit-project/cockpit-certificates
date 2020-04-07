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

import { Alert, AlertGroup, AlertActionCloseButton, AlertVariant } from '@patternfly/react-core';

const _ = cockpit.gettext;

export class Application extends React.Component {
    constructor() {
        super();
        this.state = {
            alerts: []
        };

        this.addAlert = this.addAlert.bind(this);
        this.removeAlert = this.removeAlert.bind(this);

    }

    addAlert(title, message) {
        const alerts = [...this.state.alerts];
        alerts.push({ title, message });

        this.setState({ alerts: alerts });
    }

    removeAlert(index) {
        const alerts = [...this.state.alerts];
        alerts.splice(index, 1);

        this.setState({ alerts: alerts });
    }

    render() {
        return (
            <>
                <div className="container-fluid">
                    <h2>Certificates</h2>
                </div>
                <AlertGroup isToast>
                    {this.state.alerts.map((danger, index) => (
                        <Alert isLiveRegion
                            variant={AlertVariant["danger"]}
                            title={danger.title}
                            action={
                                <AlertActionCloseButton variantLabel="danger alert"
                                  onClose={() => this.removeAlert(index)} />
                            }
                            key={index}>
                                {_("Error message: ") + danger.message}
                            </Alert>
                    ))}
                </AlertGroup>
            </>
        );
    }
}
