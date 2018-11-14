import React, {Component} from 'react';
import { Drawer, Form, Button, Col, Row, Input } from 'antd';


class DrawerForm extends Component {

    onClose = () => {
        this.props.onClose(false)
    };

    render() {
        const { getFieldDecorator } = this.props.form;
        return (
            <div>
                <Drawer
                    title="connect device"
                    width={720}
                    placement="right"
                    onClose={this.onClose}
                    maskClosable={false}
                    visible={this.props.visible}
                    style={{
                        height: 'calc(100% - 55px)',
                        overflow: 'auto',
                        paddingBottom: 53,
                    }}
                >
                    <Form layout="vertical" hideRequiredMark>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="devId">
                                    {getFieldDecorator('devId', {
                                        rules: [{ required: true, message: 'please enter devId' }],
                                    })(<Input placeholder="please enter devId" />)}
                                </Form.Item>
                            </Col>
                           
                            <Col span={12}>
                                <Form.Item label="webSocket">
                                    {getFieldDecorator('ws', {
                                        rules: [{ required: true, message: 'please enter url' }],
                                    })(
                                        <Input
                                            style={{ width: '100%' }}
                                            addonBefore="ws://"
                                            //addonAfter=".com"
                                            placeholder="please enter ws"
                                        />
                                    )}
                                </Form.Item>
                            </Col>
                        </Row>
                        
                    </Form>
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            width: '100%',
                            borderTop: '1px solid #e8e8e8',
                            padding: '10px 16px',
                            textAlign: 'right',
                            left: 0,
                            background: '#fff',
                            borderRadius: '0 0 4px 4px',
                        }}
                    >
                        <Button
                            style={{
                                marginRight: 8,
                            }}
                            onClick={this.onClose}
                        >
                            Cancel
                        </Button>
                        <Button onClick={this.onClose} type="primary">Connect</Button>
                    </div>
                </Drawer>
            </div>
        );
    }
    
}
const DeviceForm = Form.create()(DrawerForm);
export default DeviceForm;


