import { Avatar,Col, Popover, Row, Select, Modal } from 'antd';
import {
  DeleteOutlined,
  InfoCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import {
  MarketProvider,
  getMarketInfos,
  getTradePageUrl,
  useMarket,
  useMarketsList,
  //useMarkPrice,
} from '../utils/markets';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import CustomMarketDialog from '../components/CustomMarketDialog';
import DeprecatedMarketsInstructions from '../components/DeprecatedMarketsInstructions';
import LinkAddress from '../components/LinkAddress';
import Orderbook from '../components/Orderbook';
import StandaloneBalancesDisplay from '../components/StandaloneBalancesDisplay';
import { TVChartContainer } from '../components/TradingView'
import TradeForm from '../components/TradeForm';
import TradesTable from '../components/TradesTable';
import UserInfoTable from '../components/UserInfoTable';
import { notify } from '../utils/notifications';
import styled from 'styled-components';
import { nanoid } from 'nanoid';
import FloatingElement from '../components/layout/FloatingElement';
import ModalHeaderImg from '../assets/modal_header_pic.png'



const { Option, OptGroup } = Select;

const Wrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 16px;
  .borderNone .ant-select-selector {
    border: none !important;
  };
`;

export default function TradePage() {
  const { marketAddress } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  useEffect(() => {
    if (marketAddress) {
      localStorage.setItem('marketAddress', JSON.stringify(marketAddress));
    }
  }, [marketAddress]);
  const history = useHistory();
  function setMarketAddress(address) {
    history.push(getTradePageUrl(address));
  }

  return (
    <>

      <MarketProvider
        marketAddress={marketAddress}
        setMarketAddress={setMarketAddress}
      >
        <TradePageInner />
      </MarketProvider>
      <Modal visible={isModalOpen} footer={null} onOk={handleOk} onCancel={()=>handleCancel()} className="init-modal">
        <img src={ModalHeaderImg} style={{ height: "94px" }} alt="" />
        <div className="space" />
        <p>The SWOLE DEX is a fully decentralized exchange. No representation or warranty is made concerning any aspect of the SWOLE DEX, including its suitability, quality, availability, accessibility, accuracy or safety. Access to and use of the SWOLE DEX is entirely at users’ own risk and could lead to substantial losses. Users take full responsibility for their use of the SWOLE DEX, including participation in the sale or purchase of any products, including, without limitation, tokens and coins.</p>
        <div className="space" />
        <p>The main purpose of this website is to earn service fees</p>
        <p>to keep the SWOLE project and SWOLE V2 token afloat and to keep </p>
        <p>raising awareness as it is our main intent.</p>
        <div className="space" />
        <p>Each time you make a transaction on this website, 0.005 SOL is charged</p>
        <p>to your wallet and sent to the SWOLE treasury to support our efforts</p>
        <div className="space" />
        <p>By using this website  you agree to our terms and conditions and are under complete understanding of all content held therein.</p>
        <div className="space" />
        <p>The SWOLE DEX is no t  to be used by residents of Prohibited Jurisdictions.</p>
        <p className="modal-more-info">more information can be found on the SWOLE whitepaper</p>
      </Modal>
    </>


  );
}

function TradePageInner() {
  const {
    market,
    marketName,
    customMarkets,
    setCustomMarkets,
    setMarketAddress,
  } = useMarket();
  const markets = useMarketsList();
  const [handleDeprecated, setHandleDeprecated] = useState(false);
  const [addMarketVisible, setAddMarketVisible] = useState(false);
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });
  useEffect(() => {
    document.title = marketName ? `${marketName} — Serum` : 'Serum';
  }, [marketName]);

  const changeOrderRef = useRef<
    ({ size, price }: { size?: number; price?: number }) => void
  >();

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const width = dimensions?.width;
  const componentProps = {
    onChangeOrderRef: (ref) => (changeOrderRef.current = ref),
    onPrice: useCallback(
      (price) => changeOrderRef.current && changeOrderRef.current({ price }),
      [],
    ),
    onSize: useCallback(
      (size) => changeOrderRef.current && changeOrderRef.current({ size }),
      [],
    ),
  };
  const component = (() => {
    if (handleDeprecated) {
      return (
        <DeprecatedMarketsPage
          switchToLiveMarkets={() => setHandleDeprecated(false)}
        />
      );
    } else if (width < 1000) {
      return <RenderSmaller {...componentProps} />;
    } else if (width < 1450) {
      return <RenderSmall {...componentProps} />;
    } else {
      return <RenderNormal {...componentProps} />;
    }
  })();

  const onAddCustomMarket = (customMarket) => {
    const marketInfo = getMarketInfos(customMarkets).some(
      (m) => m.address.toBase58() === customMarket.address,
    );
    if (marketInfo) {
      notify({
        message: `A market with the given ID already exists`,
        type: 'error',
      });
      return;
    }
    const newCustomMarkets = [...customMarkets, customMarket];
    setCustomMarkets(newCustomMarkets);
    setMarketAddress(customMarket.address);
  };

  const onDeleteCustomMarket = (address) => {
    const newCustomMarkets = customMarkets.filter((m) => m.address !== address);
    setCustomMarkets(newCustomMarkets);
  };
  const [newMarKets] = useState(markets);


  return (
    <>
      <CustomMarketDialog
        visible={addMarketVisible}
        onClose={() => setAddMarketVisible(false)}
        onAddCustomMarket={onAddCustomMarket}
      />
      <Wrapper>
        <Row
          align="middle"
          style={{ paddingLeft: 5, paddingRight: 5, height: 74 }}
          gutter={16}
        >
          <Col>
            <MarketSelector
              markets={newMarKets}
              setHandleDeprecated={setHandleDeprecated}
              placeholder={'Select market'}
              customMarkets={customMarkets}
              onDeleteCustomMarket={onDeleteCustomMarket}
            />
          </Col>


          {market ? (
            <Col>
              <Popover
                content={<LinkAddress address={market.publicKey.toBase58()} />}
                placement="bottomRight"
                title="Market address"
                trigger="click"
              >
                <InfoCircleOutlined style={{ color: '#ffffff' }} />
              </Popover>
            </Col>
          ) : null}
          <Col>
            <PlusCircleOutlined
              style={{ color: '#ffffff' }}
              onClick={() => setAddMarketVisible(true)}
            />
          </Col>

        </Row>
        {component}
      </Wrapper>
    </>
  );
}

function MarketSelector({
  markets,
  placeholder,
  setHandleDeprecated,
  customMarkets,
  onDeleteCustomMarket,
}) {
  const { market, setMarketAddress } = useMarket();

  const onSetMarketAddress = (marketAddress) => {
    setHandleDeprecated(false);
    setMarketAddress(marketAddress);
  };

  const extractBase = (a) => a.split('/')[0];
  const extractQuote = (a) => a.split('/')[1];

  const selectedMarket = getMarketInfos(customMarkets)
    .find(
      (proposedMarket) =>
        market?.address && proposedMarket.address.equals(market.address),
    )
    ?.address?.toBase58();

  return (
    <Select
      showSearch
      size={'large'}
      style={{ width: 350, border: "2px solid white", padding: "10px", borderRadius: "20px" }}
      placeholder={placeholder || 'Select a market'}
      optionFilterProp="name"
      onSelect={onSetMarketAddress}
      listHeight={400}
      value={selectedMarket}
      filterOption={(input, option) =>
        option?.name?.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
    >
      {customMarkets && customMarkets.length > 0 && (
        <OptGroup label="Custom">
          {customMarkets.map(({ address, name }, i) => (
            <Option
              value={address}
              key={nanoid()}
              name={name}
              style={{
                padding: '10px',
                // @ts-ignore
                backgroundColor: i % 2 === 0 ? 'rgb(39, 44, 61)' : null,
              }}
            >
              <Row>
                <Col flex="auto">{name}</Col>
                {selectedMarket !== address && (
                  <Col>
                    <DeleteOutlined
                      onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        onDeleteCustomMarket && onDeleteCustomMarket(address);
                      }}
                    />
                  </Col>
                )}
              </Row>
            </Option>
          ))}
        </OptGroup>
      )}
      <OptGroup label="Markets">
        {markets
          .sort((a, b) =>
            extractQuote(a.name) === 'USDT' && extractQuote(b.name) !== 'USDT'
              ? -1
              : extractQuote(a.name) !== 'USDT' &&
                extractQuote(b.name) === 'USDT'
                ? 1
                : 0,
          )
          .sort((a, b) =>
            extractBase(a.name) < extractBase(b.name)
              ? -1
              : extractBase(a.name) > extractBase(b.name)
                ? 1
                : 0,
          )
          .map(({ address, name, image, deprecated }, i) => (
            <Option
              value={address.toBase58()}
              key={nanoid()}
              name={name}
              style={{
                padding: '10px',
                // @ts-ignore 
                backgroundColor: i % 2 === 0 ? 'rgb(39, 44, 61)' : null,
              }}
            >
              <Avatar
                src={image}
                style={{ width: '43px', height: '43px', marginRight: '20px' }}
                shape="square"
              />
              <strong style={{ fontSize: 30 }}>{name} {deprecated ? ' (Deprecated)' : null}</strong>
            </Option>
          ))}
      </OptGroup>
    </Select>
  );
}

const DeprecatedMarketsPage = ({ switchToLiveMarkets }) => {
  return (
    <>
      <Row>
        <Col flex="auto">
          <DeprecatedMarketsInstructions
            switchToLiveMarkets={switchToLiveMarkets}
          />
        </Col>
      </Row>
    </>
  );
};

const RenderNormal = ({ onChangeOrderRef, onPrice, onSize }) => {
  return (
    <Row
      style={{
        minHeight: '900px',
        flexWrap: 'nowrap',
      }}
    >

      <Col flex="350px" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TradeForm setChangeOrderRef={onChangeOrderRef} style={{ minHeight: 300 }} />
        <StandaloneBalancesDisplay />
      </Col>

      <Col flex="auto" style={{ display: 'flex', flexDirection: 'column', marginTop: -75 }}>
        <FloatingElement style={{
          flex: 1, minHeight: '600px', padding: 0, overflow: 'hidden',
          ...styled,
        }}>
          <TVChartContainer />
        </FloatingElement>
        <UserInfoTable />
      </Col>
      <Col flex={'400px'} style={{ display: 'flex', flexDirection: 'column', marginTop: -75 }}>
        <Orderbook smallScreen={false} onPrice={onPrice} onSize={onSize} />
        <FloatingElement style={{
          flex: 1, minHeight: '600px', padding: 0, overflow: 'hidden',
          ...styled,
        }}>
          <TradesTable smallScreen={false} />
        </FloatingElement>

      </Col>

    </Row>
  );
};

const RenderSmall = ({ onChangeOrderRef, onPrice, onSize }) => {
  return (
    <>
      <Row>
        <Col flex="2" style={{ display: 'flex', flexDirection: 'column' }}>
          <FloatingElement style={{
            flex: 2, minHeight: '150px', padding: 0, overflow: 'hidden',
            ...styled,
          }}>
            <TVChartContainer />
          </FloatingElement>
        </Col>
        <Col flex="1">
          <StandaloneBalancesDisplay />
        </Col>
      </Row>
      <Row>
        {/* style={{
          height: '950px',
        }} */}
        <Col flex="1" style={{ maxHeight: '450px', display: 'flex' }}>
          <Orderbook smallScreen={true} onPrice={onPrice} onSize={onSize} />
        </Col>
        <Col
          flex="1"
          style={{
            height: '450px',
            display: 'flex',
          }}
        >
          <TradeForm setChangeOrderRef={onChangeOrderRef} />
        </Col>
        <Col flex="1" style={{ maxHeight: '450px', display: 'flex' }}>
          <TradesTable smallScreen={true} />
        </Col>
      </Row>
      <Row>
        <Col flex="auto">
          <UserInfoTable />
        </Col>
      </Row>
    </>
  );
};

const RenderSmaller = ({ onChangeOrderRef, onPrice, onSize }) => {
  return (
    <>
      <Row>
        <Col flex="auto" style={{ display: 'flex', flexDirection: 'column' }}>
          <FloatingElement style={{
            flex: "1", minHeight: '600px', padding: 0, overflow: 'hidden',
            ...styled,
          }}>
            <TVChartContainer />
          </FloatingElement>
        </Col>
      </Row>.
      <Row>
        <Col xs={24} sm={12} style={{ height: '50%', display: 'flex' }}>
          <TradeForm style={{ flex: 1 }} setChangeOrderRef={onChangeOrderRef} />
        </Col>
        <Col xs={24} sm={12}>
          <StandaloneBalancesDisplay />
        </Col>
      </Row>
      <Row>
        <Col xs={24} sm={12} style={{ height: '100%', display: 'flex' }}>
          <Orderbook smallScreen={false} onPrice={onPrice} onSize={onSize} />
        </Col>
        <Col xs={24} sm={12} style={{ height: '50%', display: 'flex', maxHeight: '500px' }}>
          <TradesTable smallScreen={true} />
        </Col>
      </Row>
      <Row>
        <Col flex="auto" style={{ height: '100%', display: 'flex' }}>
          <UserInfoTable />
        </Col>
      </Row>
    </>
  );
};
