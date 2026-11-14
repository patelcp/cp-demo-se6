// Below are built-in components that are available in the app, it's recommended to keep them as is
import { NextjsContentSdkComponent } from '@sitecore-content-sdk/nextjs';


import { BYOCServerWrapper, FEaaSServerWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

// end of built-in import section
import * as SiteHeader from 'src/components/site-header/SiteHeader';
import * as SiteFooter from 'src/components/site-footer/SiteFooter';
import * as RichTextSection from 'src/components/rich-text-section/RichTextSection';
import * as ResourceList from 'src/components/resource-list/ResourceList';
import * as PartialDesignDynamicPlaceholder from 'src/components/partial-design-dynamic-placeholder/PartialDesignDynamicPlaceholder';
import * as PageIntro from 'src/components/page-intro/PageIntro';
import * as Hero from 'src/components/hero/Hero';
import * as CardGrid from 'src/components/card-grid/CardGrid';
import * as CallToAction from 'src/components/call-to-action/CallToAction';
import * as Breadcrumb from 'src/components/breadcrumb/Breadcrumb';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCServerWrapper],
  ['FEaaSWrapper', FEaaSServerWrapper],
  ['Form', { ...Form, componentType: 'client' }],
  ['SiteHeader', { ...SiteHeader, componentType: 'client' }],
  ['SiteFooter', { ...SiteFooter }],
  ['RichTextSection', { ...RichTextSection }],
  ['ResourceList', { ...ResourceList, componentType: 'client' }],
  ['PartialDesignDynamicPlaceholder', { ...PartialDesignDynamicPlaceholder }],
  ['PageIntro', { ...PageIntro }],
  ['Hero', { ...Hero, componentType: 'client' }],
  ['CardGrid', { ...CardGrid }],
  ['CallToAction', { ...CallToAction }],
  ['Breadcrumb', { ...Breadcrumb }],
]);

export default componentMap;
