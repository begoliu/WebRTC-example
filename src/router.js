import React, {Component} from 'react';
import { Route, Switch } from 'react-router-dom';

import LocalPeer from './Page/Local'
import DevicePeer from "./Page/Device";


class RootRouter extends Component {
    render() {
        return (
            <Switch>
                <Route exact path="/" component={DevicePeer} />
                <Route path="/Local" component={LocalPeer} />
            </Switch>
        );
    }
}

export default RootRouter;