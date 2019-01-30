import React, {Component} from 'react';
import { Route, Switch } from 'react-router-dom';

import LocalPeer from './Page/Local'
import DevicePeer from "./Page/Device";


class RootRouter extends Component {
    render() {
        return (
            <Switch>
                <Route exact path="/sdk" component={DevicePeer} />
                <Route path="/sdk/local" component={LocalPeer} />
            </Switch>
        );
    }
}

export default RootRouter;