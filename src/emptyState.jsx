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

import React from "react";

import { EmptyStatePanel } from "../lib/cockpit-components-empty-state.jsx";
import { Button } from '@patternfly/react-core';

import { ExclamationCircleIcon } from "@patternfly/react-icons";

const _ = cockpit.gettext;

class EmptyState extends React.Component {
    startCertmonger() {
        const { service, updateService } = this.props;

        service.start()
                .then(() => updateService())
                .fail(error => console.error(_("Starting a service failed: ")
                + JSON.stringify(error))); // TODO better error handling
    }

    render() {
        const { service, serviceName, errorMessage } = this.props;

        const troubleshoot = (
            <Button variant="link"
                onClick={ () => cockpit.jump("/system/services#/" + serviceName) }>
                { _("Troubleshoot") }
            </Button>
        );

        if (!service || !service.exists) {
            return <EmptyStatePanel title={ _("Loading the certificate service") } loading/>;
        } else if (service.state === "starting") {
            return <EmptyStatePanel title={ _("Starting the certificate service") } loading/>;
        } else if (!service.state !== "running") {
            return <EmptyStatePanel title={ _("The certificate service is not active") }
                       icon={ ExclamationCircleIcon }
                       paragraph={ errorMessage }
                       secondary={ troubleshoot }
                       action={ _("Start the certificate service") }
                       onAction={ () => this.startCertmonger() } />;
        }
    }
}

export default EmptyState;

