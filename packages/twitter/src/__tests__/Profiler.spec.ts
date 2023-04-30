import moxy from '@moxyjs/moxy';
import TwitterBot from '../Bot';
import TwitterUser from '../User';
import TwitterUserProfile from '../UserProfile';
import TwitterProfiler from '../Profiler';
import { RawUser } from '../types';

const bot = moxy<TwitterBot>({
  makeApiCall: () => ({}),
} as never);

const agent = new TwitterUser('1234567890');

const userData = {
  id: 6253282,
  id_str: '6253282',
  name: 'Twitter API',
  screen_name: 'TwitterAPI',
  location: 'San Francisco, CA',
  description:
    "The Real Twitter API. Tweets about API changes, service issues and our Developer Platform. Don't get an answer? It's on my website.",
  url: 'https://t.co/8IkCzCDr19',
  profile_image_url_https:
    'https://pbs.twimg.com/profile_images/942858479592554497/BbazLO9L_normal.jpg',
} as RawUser;

const settingsData = {
  language: 'en',
  screen_name: 'theSeanCook',
  time_zone: {
    name: 'Pacific Time (US & Canada)',
    tzinfo_name: 'America/Los_Angeles',
    utc_offset: -28800,
  },
};

beforeEach(() => {
  bot.mock.reset();
});

describe('.getUserProfile(user)', () => {
  it('use data attached with the user by default', async () => {
    const user = new TwitterUser('6253282', userData);
    const profiler = new TwitterProfiler(bot);

    const profile = await profiler.getUserProfile(agent, user);

    expect(profile instanceof TwitterUserProfile).toBe(true);
    expect(profile.id).toBe('6253282');

    expect(bot.makeApiCall).not.toHaveBeenCalled();
  });

  it("get data from API if it's not attached with the user", async () => {
    const user = new TwitterUser('6253282');
    const profiler = new TwitterProfiler(bot);

    bot.makeApiCall.mock.fake(async () => userData);
    const profile = await profiler.getUserProfile(agent, user);

    expect(profile instanceof TwitterUserProfile).toBe(true);
    expect(profile.id).toBe('6253282');

    expect(bot.makeApiCall).toHaveBeenCalledTimes(1);
    expect(bot.makeApiCall).toHaveBeenCalledWith({
      agent,
      method: 'GET',
      path: '1.1/users/show.json',
      params: {
        user_id: '6253282',
        include_entities: false,
      },
    });
  });

  it('use data from API if fromApi option is true', async () => {
    const user = new TwitterUser('6253282', userData);
    const profiler = new TwitterProfiler(bot);

    bot.makeApiCall.mock.fake(async () => ({
      ...userData,
      description: 'This time it is from API',
    }));
    const profile = await profiler.getUserProfile(agent, user, {
      fromApi: true,
    });

    expect(profile.description).toBe('This time it is from API');

    expect(bot.makeApiCall).toHaveBeenCalledTimes(1);
    expect(bot.makeApiCall).toHaveBeenCalledWith({
      agent,
      method: 'GET',
      path: '1.1/users/show.json',
      params: {
        user_id: '6253282',
        include_entities: false,
      },
    });
  });

  it('get settings data if withSettings option is true', async () => {
    const user = new TwitterUser('6253282', userData);
    const profiler = new TwitterProfiler(bot);

    bot.makeApiCall.mock.fake(async () => settingsData);
    const profile = await profiler.getUserProfile(agent, user, {
      withSettings: true,
    });

    expect(profile.id).toBe('6253282');
    expect(profile.timeZone).toBe(-8);
    expect(profile.languageCode).toBe('en');

    expect(bot.makeApiCall).toHaveBeenCalledTimes(1);
    expect(bot.makeApiCall).toHaveBeenCalledWith({
      agent,
      method: 'GET',
      path: '1.1/account/settings.json',
    });
  });

  test('withEntities option', async () => {
    const user = new TwitterUser('6253282');
    const profiler = new TwitterProfiler(bot);

    bot.makeApiCall.mock.fake(async () => userData);
    const profile = await profiler.getUserProfile(agent, user, {
      withEntities: true,
    });

    expect(profile instanceof TwitterUserProfile).toBe(true);
    expect(profile.id).toBe('6253282');

    expect(bot.makeApiCall).toHaveBeenCalledTimes(1);
    expect(bot.makeApiCall).toHaveBeenCalledWith({
      agent,
      method: 'GET',
      path: '1.1/users/show.json',
      params: {
        user_id: '6253282',
        include_entities: true,
      },
    });
  });
});
