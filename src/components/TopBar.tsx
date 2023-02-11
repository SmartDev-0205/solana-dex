import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { ENDPOINTS, useConnectionConfig } from '../utils/connection';
import CustomClusterEndpointDialog from './CustomClusterEndpointDialog';
import { EndpointInfo } from '../utils/types';
import { notify } from '../utils/notifications';
import { Connection } from '@solana/web3.js';
import WalletConnect from './WalletConnect';
import { getTradePageUrl, useMarketPriceCache} from '../utils/markets';

import LogoImg from '../assets/swole-v2-logo.svg';
import DiscordImg from '../assets/discord.svg';
import TwitterImg from '../assets/twitter.svg';

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
  '/docs': 'https://nfb-2.gitbook.io/welcome-to-gitbook/Dy55Mjc7oEEXKtsx3roP/.',
  '/trading': 'https://nonfungibledex.org/#/market/A8YFbxQYFVqKZaoYJLLUVcQiWP7G2MeEgW5wsAQgMvFw',


};


export default function TopBar() {
  const {
    endpointInfo,
    setEndpoint,
    availableEndpoints,
    setCustomEndpoints,
  } = useConnectionConfig();
  const [addEndpointVisible, setAddEndpointVisible] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  // const [marketPrice, setmarketPrice] = useState(0);
  // const [marketValume, setmarketValume] = useState(0);
  const [marketPrice, marketValume] = useMarketPriceCache();

  const location = useLocation();
  const history = useHistory();
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

  const homePageUrl = "https://nonfungiblebitcoin.org";



  return (
    <>
      <CustomClusterEndpointDialog
        visible={addEndpointVisible}
        testingConnection={testingConnection}
        onAddCustomEndpoint={onAddCustomEndpoint}
        onClose={() => setAddEndpointVisible(false)}
      />
      <div className="header-container pt-25">
        <LogoWrapper onClick={() => window.location.href = homePageUrl}>
          <a href="https://https://twitter.com/SwoleDoge">
            <img src={TwitterImg} alt="" style={{ width: 47, height: 40 }} />
          </a>
          <a href="https://discord.gg/6UQjEFfSQa |">
            <img src={DiscordImg} alt="" style={{ width: 47, height: 40, marginLeft: 30 }} />
          </a>
        </LogoWrapper>

        <LogoWrapper className="main-logo" onClick={() => window.location.href = homePageUrl}>
          <img src={LogoImg} alt="" style={{ height: 120 }} />
        </LogoWrapper>

        <div className='flex align-center wallet-connect-btn'>
          <WalletConnect />
        </div>
      </div>
      <div className="market-detail">
        <div>
          <p className='detail-title'> Market Price</p>
          <p> ${marketPrice}</p>
        </div>
      </div>
    </>
  );
}