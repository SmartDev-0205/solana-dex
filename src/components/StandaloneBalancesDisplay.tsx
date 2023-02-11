import { Button } from 'antd';
import React from 'react';
import FloatingElement from './layout/FloatingElement';
import styled from 'styled-components';
import {
  useBalances,
  useMarket,
  useSelectedBaseCurrencyAccount,
  useSelectedOpenOrdersAccount,
  useSelectedQuoteCurrencyAccount,
} from '../utils/markets';
import { useWallet } from '../utils/wallet';
import { settleFunds } from '../utils/send';
import { useSendConnection } from '../utils/connection';
import { notify } from '../utils/notifications';
import { Balances } from '../utils/types';

const ActionButton = styled(Button)`
  color: rgba(241, 241, 242, 0.75);
  font-size: 12px;
  display: 'inline-block';
  padding-right: 15px;
  margin:auto;
  display:flex;
  align-items:center;
  justify-content:center;
  padding-left: 15px;
  border-radius: 4px;
  border: 1px solid rgba(241, 241, 242, 0.5);
  width: 270px;
  height: 60px;
  border-radius: 12px;
  background: ##E6BE4B;
  background-color: #E6BE4B;
  color: black;
  font-weight: 600;
  font-size: 25px;
`;

export default function StandaloneBalancesDisplay() {
  const { baseCurrency, quoteCurrency, market } = useMarket();
  const balances = useBalances();
  const openOrdersAccount = useSelectedOpenOrdersAccount(true);
  const connection = useSendConnection();
  const { wallet } = useWallet();
  const baseCurrencyAccount = useSelectedBaseCurrencyAccount();
  const quoteCurrencyAccount = useSelectedQuoteCurrencyAccount();
  const baseCurrencyBalances =
    balances && balances.find((b) => b.coin === baseCurrency);
  const quoteCurrencyBalances =
    balances && balances.find((b) => b.coin === quoteCurrency);

  async function onSettleFunds() {
    if (!wallet) {
      notify({
        message: 'Wallet not connected',
        description: 'wallet is undefined',
        type: 'error',
      });
      return;
    }

    if (!market) {
      notify({
        message: 'Error settling funds',
        description: 'market is undefined',
        type: 'error',
      });
      return;
    }
    if (!openOrdersAccount) {
      notify({
        message: 'Error settling funds',
        description: 'Open orders account is undefined',
        type: 'error',
      });
      return;
    }
    if (!baseCurrencyAccount) {
      notify({
        message: 'Error settling funds',
        description: 'Open orders account is undefined',
        type: 'error',
      });
      return;
    }
    if (!quoteCurrencyAccount) {
      notify({
        message: 'Error settling funds',
        description: 'Open orders account is undefined',
        type: 'error',
      });
      return;
    }

    try {
      await settleFunds({
        market,
        openOrders: openOrdersAccount,
        connection,
        wallet,
        baseCurrencyAccount,
        quoteCurrencyAccount,
      });
    } catch (e) {
      notify({
        message: 'Error settling funds',
        description: e.message,
        type: 'error',
      });
    }
  }

  const formattedBalances: [
    string | undefined,
    Balances | undefined,
    string,
    string | undefined,
  ][] = [
      [
        baseCurrency,
        baseCurrencyBalances,
        'base',
        market?.baseMintAddress.toBase58(),
      ],
      [
        quoteCurrency,
        quoteCurrencyBalances,
        'quote',
        market?.quoteMintAddress.toBase58(),
      ],
    ];
  return (
    <FloatingElement style={{ flex: 1, paddingTop: 9 }}>
      <div className='title'>My Wallet</div>
      <div
        style={{
          width: '100%',
          // borderBottom: '1px solid #1C274F',
          fontSize: 17,
          paddingBottom: 20,
          marginTop: 48

        }}
      >
        Wallet Balance
      </div>
      {formattedBalances.map(
        ([currency, balances, baseOrQuote, mint], index) => (
          <React.Fragment key={index}>

            <div className="assert">
              <div className='currency'>{currency}</div>
              <div>{balances && balances.wallet || "-"} </div>
            </div>
          </React.Fragment>
        ),
      )}


      <div
        style={{
          width: '100%',
          // borderBottom: '1px solid #1C274F',
          fontSize: 17,
          paddingBottom: 20,
          marginTop: 48

        }}
      >
        Unsettled balances
      </div>
      {formattedBalances.map(
        ([currency, balances, baseOrQuote, mint], index) => (
          <React.Fragment key={index}>

            <div className="assert">
              <div className='currency'>{currency}</div>
              <div>{balances && balances.unsettled || "-"} </div>
            </div>
          </React.Fragment>
        ),
      )}



      <ActionButton size="small" onClick={onSettleFunds}>
        Settle
      </ActionButton>


    </FloatingElement>
  );
}
