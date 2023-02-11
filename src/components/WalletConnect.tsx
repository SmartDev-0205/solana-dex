import React from 'react';
import { Dropdown, Menu } from 'antd';
import { useWallet } from '../utils/wallet';
import LinkAddress from './LinkAddress';

export default function WalletConnect() {
  const { connected, wallet, select, connect, disconnect } = useWallet();
  const publicKey = (connected && wallet?.publicKey?.toBase58()) || '';

  const menu = (
    <Menu className='wallet-menu'>
      {connected && <LinkAddress shorten={true} address={publicKey} />}
      <Menu.Item key="3" onClick={select}>
        Change Wallet
      </Menu.Item>
    </Menu>
  );

  return (
    <div className='connect-button-container'>
      <Dropdown.Button onClick={connected ? disconnect : connect} overlay={menu}>
        {connected ? 'Disconnect' : 'Connect'}
      </Dropdown.Button>
    </div>
  );
}
