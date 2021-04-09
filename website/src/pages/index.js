import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import CodeBlock from '@theme/CodeBlock';
import ThemedImage from '@theme/ThemedImage';
import NeonWords from '../components/NeonWords';
import styles from './styles.module.css';

const features = [
  {
    title: 'One App for All Platforms',
    description: (
      <>
        Today businesses are doing marketing and customer services through many
        conversational platforms, from <i>Email</i>, <i>Instant Messaging</i> to
        <i>Social Medias</i> to <i>Voice Assistance</i>.
        <br/>
        Develop a chat app with Machinat once, then you can ship services over
        all these channels and reach more users.
      </>
    ),
  },
  {
    title: 'Hybrid of Chat and Web UI',
    description: (
      <>
        Conversational UI is easy to access, but not as functional as graphical
        UI. With Machinat, you can have both advantages by opening an embeded
        webview in the chatroom.
        <br/>
        The Hybrid App can improve the expereience of complex actions and
        provide more enriched features.
      </>
    ),
  },
  {
    title: 'Declarative API for Omni-Channel Experiences',
    description: (
      <>
        Machinat use JSX API like React to contstruct chat UI in declarative
        views. The view is composed by flexible components, which allows you
        modify the expression while rendering.
        <br/>
        This helps to build aligned and integrated experiences across diverse
        channels, and meanwhile make optimization for every platform.
      </>
    ),
  },
  {
    title: 'Natural Marketing with Social Network',
    description: (
      <>
        Machinat app built on <i>Instant Messaging</i> and <i>Social Media</i>
        has native potential to go viral.
        <br/>
        Adding features to allow your app to be used in group chat or
        community. Users would be glad to share proactively, and the app can be
        marketed automatically by itself.
      </>
    ),
  },
  {
    title: 'Open-Source, Pluginable and Extensible',
    description: (
      <>
        Machinat framework is and will be open-source. No worry about
        being bound to specific infrastructure provider.
        <br/>
        It's also easy to develop plugins, UI components, or even your own
        event-based platforms.
        <br/>
        Enjoy the ecosystem without any restriction!
      </>
    ),
  },
];

function Feature({title, description}) {
  return (
    <section className={styles.featureContainer}>
      <div className="container">
        <div className="row">
          <div className={clsx('col col--7', styles.zzz)}>
            <h3 className={styles.featureTitle}>{title}</h3>
            <p className={styles.featureContent}>{description}</p>
          </div>
          <div className={clsx('col col--5', styles.xxx)}>
          </div>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const {siteConfig = {}} = context;

  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}>
      <header className={clsx('hero hero--primary-lightest', styles.heroBanner)}>
        <ThemedImage
          className={styles.heroBannerBackground}
          sources={{
            light: 'img/hero-background.svg',
            dark: 'img/hero-background-dark.svg',
          }}
        />

        <div className={clsx(styles.heroContainer, 'container')}>
          <ThemedImage
            className={styles.heroLogo}
            sources={{
              light: 'img/logo.svg',
              dark: 'img/logo-dark.svg',
            }}
          />

          <div className={clsx('hero__subtitle', styles.heroSubtitle)}>
            <div>Build Next-Gen Chat App</div>{' '}
            <div>on ALL <NeonWords>Conversational Platforms</NeonWords></div>
          </div>

          <div className={styles.buttonsContainer}>
            <Link
              className={clsx(
                'button button--outline button--secondary button--lg',
                styles.button,
              )}
              to={useBaseUrl('docs/')}>
              Get Started
            </Link>
            <div className={styles.buttonSpacer} />
            <Link
              className={clsx(
                'button button--outline button--secondary button--lg',
                styles.button,
              )}
              to="https://github.com/machinat/machinat">
              GitHub
              <ThemedImage
                className={styles.buttonGitHubImage}
                sources={{
                  light: 'img/github-mark.png',
                  dark: 'img/github-mark-light.png',
                }}
              />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {features && features.map((props, idx) => (
          <Feature key={idx} {...props} />
        ))}
      </main>
    </Layout>
  );
}

export default Home;
