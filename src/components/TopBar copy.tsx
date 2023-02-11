import {
  PlusCircleOutlined,
  SettingOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { Button, Col, Menu, Popover, Row, Select } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useWallet } from '../utils/wallet';
import logo from '../assets/logo.svg';
import { ENDPOINTS, useConnectionConfig } from '../utils/connection';
import Settings from './Settings';
import MobileMenu from './MobileMenu';
import CustomClusterEndpointDialog from './CustomClusterEndpointDialog';
import { EndpointInfo } from '../utils/types';
import { notify } from '../utils/notifications';
import { Connection } from '@solana/web3.js';
import WalletConnect from './WalletConnect';
import AppSearch from './AppSearch';
import { getTradePageUrl } from '../utils/markets';

const Wrapper = styled.div`
  background: linear-gradient(100.61deg, #090B0B 0%, #1C2222 100%);
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  padding: 0px 30px;
  flex-wrap: wrap;
`;
const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  img {
    height: 34px;
    margin-right: 8px;
    margin-top: 4px;
  }
`;

const EXTERNAL_LINKS = {
  '/learn': 'https://serum-academy.com/en/serum-dex/',
  '/add-market': 'https://serum-academy.com/en/add-market/',
  '/wallet-support': 'https://serum-academy.com/en/wallet-support',
  '/dex-list': 'https://serum-academy.com/en/dex-list/',
  '/developer-resources': 'https://serum-academy.com/en/developer-resources/',
  '/explorer': 'https://explorer.solana.com',
  '/srm-faq': 'https://projectserum.com/srm-faq',
  '/swap': 'https://swap.projectserum.com',
  'https://solapeswap.io/#/market/4zffJaPyeXZ2wr4whHgP39QyTfurqZ2BEd4M5W6SEuon': 'https://solapeswap.io/#/market/4zffJaPyeXZ2wr4whHgP39QyTfurqZ2BEd4M5W6SEuon',
  'https://apexlev.solapeswap.io/': 'https://apexlev.solapeswap.io/',
};

export default function TopBar() {
  const { connected, wallet } = useWallet();
  const {
    endpoint,
    endpointInfo,
    setEndpoint,
    availableEndpoints,
    setCustomEndpoints,
  } = useConnectionConfig();
  const [addEndpointVisible, setAddEndpointVisible] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const location = useLocation();
  const history = useHistory();
  const [searchFocussed, setSearchFocussed] = useState(false);
  const [isMobileMenuActive, setIsMobileMenuActive] = useState(false);

  const handleClick = useCallback(
    (e) => {
      document.body.classList.remove('mobile-menu--open');
      setIsMobileMenuActive(false);

      if (!(e.key in EXTERNAL_LINKS)) {
        history.push(e.key);
      }
    },
    [history],
  );

  const onAddCustomEndpoint = (info: EndpointInfo) => {
    const existingEndpoint = availableEndpoints.some(
      (e) => e.endpoint === info.endpoint,
    );
    if (existingEndpoint) {
      notify({
        message: `An endpoint with the given url already exists`,
        type: 'error',
      });
      return;
    }

    const handleError = (e) => {
      console.log(`Connection to ${info.endpoint} failed: ${e}`);
      notify({
        message: `Failed to connect to ${info.endpoint}`,
        type: 'error',
      });
    };

    try {
      const connection = new Connection(info.endpoint, 'recent');
      connection
        .getEpochInfo()
        .then((result) => {
          setTestingConnection(true);
          console.log(`testing connection to ${info.endpoint}`);
          const newCustomEndpoints = [
            ...availableEndpoints.filter((e) => e.custom),
            info,
          ];
          setEndpoint(info.endpoint);
          setCustomEndpoints(newCustomEndpoints);
        })
        .catch(handleError);
    } catch (e) {
      handleError(e);
    } finally {
      setTestingConnection(false);
    }
  };

  const endpointInfoCustom = endpointInfo && endpointInfo.custom;
  useEffect(() => {
    const handler = () => {
      if (endpointInfoCustom) {
        setEndpoint(ENDPOINTS[0].endpoint);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [endpointInfoCustom, setEndpoint]);

  const tradePageUrl = location.pathname.startsWith('/market/')
    ? location.pathname
    : getTradePageUrl();

  const homePageUrl = "https://solape.io";

  return (
    <>
      <CustomClusterEndpointDialog
        visible={addEndpointVisible}
        testingConnection={testingConnection}
        onAddCustomEndpoint={onAddCustomEndpoint}
        onClose={() => setAddEndpointVisible(false)}
      />
      <Wrapper>
        <LogoWrapper onClick={() => window.location.href = homePageUrl}>
        <img src={logo} alt="" style={{ width: 250, height: 60 }} />
        </LogoWrapper>

        <Menu
          mode="horizontal"
          onClick={handleClick}
          selectedKeys={[location.pathname]}
          className="solape__lg-menu"
          style={{
            borderBottom: 'none',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'flex-end',
            flex: 1,
          }}
        >
          <Menu.Item key={tradePageUrl} style={{ margin: '0 0 0 20px' }}>
            Trade
          </Menu.Item>
          <Menu.Item key={"/swap/"} style={{ margin: '0', color: '#FFE6CC', fontWeight: 'normal' }}>
            Swap
          </Menu.Item>
          <Menu.Item key="https://solapeswap.io/#/market/4zffJaPyeXZ2wr4whHgP39QyTfurqZ2BEd4M5W6SEuon" style={{ margin: '0', color: '#FFE6CC', fontWeight: 'normal' }}>
            <a href="https://solapeswap.io/#/market/4zffJaPyeXZ2wr4whHgP39QyTfurqZ2BEd4M5W6SEuon">Buy SOLAPE</a>
          </Menu.Item>
          <Menu.Item key="https://solapeswap.io/#/past-airdrops" style={{ margin: '0', color: '#FFE6CC', fontWeight: 'normal' }}>
            <a href="https://solapeswap.io/#/past-airdrops">Airdrops</a>
          </Menu.Item>
          <Menu.Item key="https://docs.solape.io/" style={{ margin: '0', color: '#FFE6CC', fontWeight: 'normal' }}>
            <a href="https://docs.solape.io/">Docs</a>
          </Menu.Item>
          <Menu.Item key="https://docs.google.com/forms/d/e/1FAIpQLSeV1VSDfDJXSz1QL0P3lVsAcg3wReAYFwm-CootlZjumzQxoQ/viewform" style={{ margin: '0', color: '#FFE6CC', fontWeight: 'normal' }}>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSeV1VSDfDJXSz1QL0P3lVsAcg3wReAYFwm-CootlZjumzQxoQ/viewform">Token Listing</a>
          </Menu.Item>
          {!searchFocussed && (
            <Menu.Item key="/swap" style={{ margin: '0 10px' }}>
              <a
                href={EXTERNAL_LINKS['/swap']}
                target="_blank"
                rel="noopener noreferrer"
              >

              </a>
            </Menu.Item>
          )}
          {connected && (!searchFocussed || location.pathname === '/balances') && (
            <Menu.Item key="/balances" style={{ margin: '0 10px' }}>
            </Menu.Item>
          )}
          {connected && (!searchFocussed || location.pathname === '/orders') && (
            <Menu.Item key="/orders" style={{ margin: '0 10px' }}>

            </Menu.Item>
          )}
          {connected && (!searchFocussed || location.pathname === '/convert') && (
            <Menu.Item key="/convert" style={{ margin: '0 10px' }}>

            </Menu.Item>
          )}
          {(!searchFocussed || location.pathname === '/list-new-market') && (
            <Menu.Item key="/list-new-market" style={{ margin: '0 10px' }}>

            </Menu.Item>
          )}
          {!searchFocussed && (
            <Menu.SubMenu
              title=""
              onTitleClick={() =>
                window.open(EXTERNAL_LINKS['/learn'], '_blank')
              }
              style={{ margin: '0 0px 0 10px' }}
            >
              <Menu.Item key="/add-market">
                <a
                  href={EXTERNAL_LINKS['/add-market']}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Adding a market
                </a>
              </Menu.Item>
              <Menu.Item key="/wallet-support">
                <a
                  href={EXTERNAL_LINKS['/wallet-support']}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Supported wallets
                </a>
              </Menu.Item>
              <Menu.Item key="/dex-list">
                <a
                  href={EXTERNAL_LINKS['/dex-list']}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  DEX list
                </a>
              </Menu.Item>
              <Menu.Item key="/developer-resources">
                <a
                  href={EXTERNAL_LINKS['/developer-resources']}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Developer resources
                </a>
              </Menu.Item>
              <Menu.Item key="/explorer">
                <a
                  href={EXTERNAL_LINKS['/explorer']}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Solana block explorer
                </a>
              </Menu.Item>
              <Menu.Item key="/srm-faq">
                <a
                  href={EXTERNAL_LINKS['/srm-faq']}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SRM FAQ
                </a>
              </Menu.Item>
            </Menu.SubMenu>
          )}
        </Menu>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingRight: 5,
          }}
        >
          <AppSearch
            onFocus={() => setSearchFocussed(true)}
            onBlur={() => setSearchFocussed(false)}
            focussed={searchFocussed}
            width={searchFocussed ? '350px' : '35px'}
          />
        </div>
        <div>
          <Row
            align="middle"
            style={{ paddingLeft: 12, paddingRight: 5 }}
            gutter={16}
          >
            <Col>
              <PlusCircleOutlined
                style={{ color: '#fff' }}
                onClick={() => setAddEndpointVisible(true)}
              />
            </Col>
            {/*
            <Col>
              <Popover
                content={endpoint}
                placement="bottomRight"
                title="URL"
                trigger="hover"
              >
                <InfoCircleOutlined style={{ color: '#2abdd2' }} />
              </Popover>
            </Col>
            <Col>
              <Select
                onSelect={setEndpoint}
                value={endpoint}
                style={{ marginRight: 8, width: '150px' }}
              >
                {availableEndpoints.map(({ name, endpoint }) => (
                  <Select.Option value={endpoint} key={endpoint}>
                    {name}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            */}
          </Row>
        </div>
        {connected && (
          <div>
            <Popover
              content={<Settings autoApprove={wallet?.autoApprove} />}
              placement="bottomRight"
              title="Settings"
              trigger="click"
            >
              <Button style={{ marginRight: 8, marginLeft: 10 }}>
                <SettingOutlined />
                Settings
              </Button>
            </Popover>
          </div>
        )}
        <div>
          <WalletConnect />
        </div>

        <div className="mobile-menu__trigger">
          <Button
            className="solape__mobile-menu__trigger__btn"
            type="text"
            onClick={() => {
              document.body.classList.add('mobile-menu--open');
              setIsMobileMenuActive(true);
            }}
            icon={<MenuOutlined />}
          />
        </div>
        {isMobileMenuActive &&
          <MobileMenu
            tradePageUrl={tradePageUrl}
            isMobileMenuActive={isMobileMenuActive}
            setIsMobileMenuActive={(a) => {
              document.body.classList.remove('mobile-menu--open');
              setIsMobileMenuActive(a);
            }}
            handleClick={handleClick}
          />
        }
      </Wrapper>
    </>
  );
}