import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { NextResponse } from 'next/server';
import axios from "axios";

const httpLink = createHttpLink({
  uri: 'https://public.zapper.xyz/graphql',
});

const API_KEY = process.env.ZAPER_API_KEY

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      'x-zapper-api-key': API_KEY,
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const DegenData = gql`
  query FungibleToken {
  fungibleToken(address: "0x4ed4e862860bed51a9570b96d89af5e1b0efefed", network: BASE_MAINNET) {
    onchainMarketData {
      price
      priceChange1h
      priceChange24h
    }
  }
}
`;

export async function GET() {
  try {
    const { data } = await client.query({
      query: DegenData,
    });

    const price = data.fungibleToken.onchainMarketData.price.toFixed(4);
    const priceChange1h= data.fungibleToken.onchainMarketData.priceChange1h.toFixed(2);
    const priceChange24h= data.fungibleToken.onchainMarketData.priceChange24h.toFixed(2);
    // console.log(data); 
    const date = new Date();
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    const text= `Daily $DEGEN Update ${day} ${month} ${year}\n\nPrice: $${price}\n1H Change: ${priceChange1h}%\n24H Change: ${priceChange24h}%`
    const signerPrivateKey = process.env.PRIVATE_KEY;

    await axios.post('https://publish.justcast.me/', {
      data: {
      text,
      "parentUrl": "https://warpcast.com/~/channel/degentokenbase",
      embeds: [
        { url: "https://degen-v2.vercel.app" }
      ], 
      mentions: [],
      mentionsPositions: []},
     fid: 268438,
      signerPrivateKey,
    });


    return NextResponse.json({
      price,
      priceChange1h,
      priceChange24h,
      
      });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }



}
