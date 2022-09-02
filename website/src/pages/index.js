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
    title: 'All Social Platforms as One',
    description: (
      <>
        Sociably integrates all the social media as{' '}
        <strong>a new app platform</strong>. Thus a{' '}
        <strong>sociable app</strong> can serve features as a real person in the
        social network.
        <div className={styles.platformArea}>
          <div className={styles.platformBox}>
            <div className={styles.platformBoxLabel}>Currently support:</div>
            <div className={styles.platformIconContainer}>
              {[
                'whatsapp',
                'facebook',
                'twitter',
                'messenger',
                'telegram',
                'line',
              ].map((platform) => (
                <div className={styles.platformIcon}>
                  <img src={`img/icon/${platform}.png`} />
                </div>
              ))}
            </div>
          </div>
          <div className={styles.platformBox}>
            <div className={styles.platformBoxLabel}>More in the future:</div>
            <div className={styles.platformIconContainer}>
              {[
                'instagram',

                'discord',
                'slack',
                'reddit',
                'youtube',
                'twitch',
                'wechat',
                'google-assistant',
                'alexa',
                'email',
                'sms',
                'browser',
                'ios',
                'android',
              ].map((platform) => (
                <div className={styles.platformIcon}>
                  <img src={`img/icon/${platform}.png`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'Webview in Chat',
    description: (
      <>
        Serve amazing features in a <i>cross-platform</i> webview.
      </>
    ),
    image: 'img/webview.webp',
  },
  {
    title: 'Declarative Chat UI',
    description: (
      <>
        Make <i>messages, actions, pauses</i> in one JSX view.
      </>
    ),
    image: 'img/expression-view.webp',
  },
  {
    title: 'UI Component',
    description: (
      <>
        Modularize <i>chat UI</i> and reuse them with ease.
      </>
    ),
    image: 'img/component.webp',
  },
  {
    title: 'Dialog Script',
    description: (
      <>
        <i>Program</i> dynamic chat flows in codes.
      </>
    ),
    image: 'img/script.webp',
  },
  {
    title: 'Dialog as a Module',
    description: (
      <>
        <i>Reuse</i> chat flows to build complicated dialogs.
      </>
    ),
    image: 'img/subscript.webp',
  },
  {
    title: 'Cross-Platform',
    description: (
      <>
        Make <i>the best UI/UX</i> on every platform.
      </>
    ),
    image: 'img/cross-platform.webp',
  },
  {
    title: 'Easy and Fast',
    description: (
      <>
        Init app in <i>1 command</i>. Start developing in <i>1 minute</i>.
      </>
    ),
    image: 'img/start-dev.webp',
  },
  {
    title: 'And More ...',
    description: (
      <>
        <li>100% open-sourced.</li>
        <li>Pure programming solution.</li>
        <li>Elegant DI system.</li>
        <li>
          Manage <i>chat state</i> with ease.
        </li>
        <li>
          Use any <i>intent recognition</i> service.
        </li>
        <li>
          <i>Reactive programming</i> styled workflow.
        </li>
        <li>
          <i>Progressive</i> and <i>extensible</i> design.
        </li>
      </>
    ),
  },
];

function Feature({ title, description, image }) {
  return (
    <section>
      <div className={styles.featureContainer}>
        <div className={styles.featureBox}>
          <h3 className={styles.featureTitle}>{title}</h3>
          <p className={styles.featureContent}>{description}</p>
          {image && <img src={image} className={styles.featureImage} />}
        </div>
      </div>
    </section>
  );
}

const LinkButton = ({ children, path }) => (
  <Link
    className={clsx(
      'button button--outline button--secondary button--lg',
      styles.button
    )}
    to={useBaseUrl(path)}
  >
    {children}
  </Link>
);

const GithubButton = () => (
  <Link
    className={clsx(
      'button button--outline button--secondary button--lg',
      styles.button
    )}
    to="https://github.com/machinat/sociably"
  >
    GitHub
    <ThemedImage
      className={styles.buttonGitHubImage}
      sources={{
        light: 'img/github-mark.png',
        dark: 'img/github-mark-light.png',
      }}
    />
  </Link>
);

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <header
        className={clsx('hero hero--primary-lightest', styles.heroBanner)}
      >
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
              light: 'img/hero-logo.svg',
              dark: 'img/hero-logo-dark.svg',
            }}
          />

          <div className={clsx('hero__subtitle', styles.heroSubtitle)}>
            <div>
              One <i>Sociable App</i>
            </div>{' '}
            <div>
              For All{' '}
              <NeonWords>
                <i>Social Platforms</i>
              </NeonWords>
            </div>
          </div>

          <div className={styles.buttonsContainer}>
            <LinkButton path="docs/">Get Started</LinkButton>
            <div className={styles.buttonSpacer} />
            <GithubButton />
          </div>
        </div>
      </header>

      <main>
        {features &&
          features.map((props, idx) => <Feature key={idx} {...props} />)}

        <section>
          <div className={styles.tryArea}>
            <h3 className={styles.tryTitle}>Get Started Today</h3>

            <div className={styles.buttonsContainer}>
              <LinkButton path="docs/">Document</LinkButton>
              <div className={styles.buttonSpacer} />
              <LinkButton path="docs/learn">Tutorial</LinkButton>
              <div className={styles.buttonSpacer} />
              <GithubButton />
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default Home;
