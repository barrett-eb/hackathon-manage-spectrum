import React from 'react';
import { parse } from 'query-string';
import jwt from 'jsonwebtoken';
import querystring from 'query-string';
import eventbrite from 'eventbrite';
import { BASE_API_URL, CLIENT_SECRET } from '../constants';
import Avatar from 'eventbrite_design_system/avatar/Avatar';
import TextListItem from 'eventbrite_design_system/textListItem/TextListItem';

export default class ExtensionPage extends React.PureComponent {
  constructor(props) {
    super(props);
    const query = parse(props.location.search || '');
    let token = query.esr ? jwt.decode(query.esr, CLIENT_SECRET) : { auth_token: querystring.parse(props.location.hash)['access_token'] };
    this.state = {
      ...token,
      attendee_count: {},
    };
    this.sdk = eventbrite({ baseUrl: BASE_API_URL, token: token.auth_token });
    this.fetchEvents = this.fetchEvents.bind(this);
    this.getUserDetails = this.getUserDetails.bind(this);
  }

  componentDidMount() {
    this.sdk.request('/users/me/?expand=image').then(user => this.setState({ user }));
    // this isn't working so it has scroll :sad_panda:
    if (window.EB && window.EB.FrameAPI) {
      console.log('found frame');
      window.EB.FrameAPI.init({});
    }
    this.fetchEvents();
  }

  fetchEvents() {
    let attendee_count = {};
    return this.sdk.request('/users/me/events/')
      .then(({ events }) => {
        Promise.all(events.map((event, key) => {
          return this.sdk.request(`/events/${event.id}/attendees/`)
            .then(({ attendees } ) => {
              attendees.forEach((att) => {
                if (!attendee_count[att.profile.email]) {
                  attendee_count[att.profile.email] = 1;
                } else {
                  attendee_count[att.profile.email]++;
                }
              });
            })
        }))
          .then(() => {
            this.setState({ attendee_count });
          });
      });
  }


  getUserDetails = (attendee, key) => {
    console.log(attendee, key);
    if (attendee) {
      const avatar = (
        <Avatar
                size="medium"
                text={'' + attendee}
        />
      );
      return (
        <TextListItem
              key={key}
              buttonType="link"
              content={key}
              extraContent={avatar}
              path=""
              onSelect={() => {}}
        />
      );
    }
    return null;
  };

  componentDidUpdate() {
    if (window.EB && window.EB.FrameAPI) {
      console.log('found frame resize');
      window.EB.FrameAPI.init({});
    }
  }

  render() {
    const gridClasses = 'eds-g-cell eds-g-cell-1-1 eds-g-cell-sm-8-12 eds-g-offset-sm-2-12 eds-g-cell-mn-6-12 eds-g-offset-mn-3-12';

    const debugInfo = (false) ? (
      <div style={{ position:'absolute', bottom: 0, backgroundColor: '#333' }}>
        <h4 style={{ color: '#DDD' }}>Token details</h4>
        <code style={{ fontSize: 11, color: '#DDD' }}>{JSON.stringify(this.state)}</code>
      </div>
    ) : null;

    let {
      attendee_count
    } = this.state;
    return (
      <div>
        <div className="eds-g-grid">
          <div className="eds-g-cell eds-g-cell-12-12">
            <section className="eds-l-pad-all-4">
              <h2 className="eds-text-hl eds-l-pad-all-2">
                Top Fans
              </h2>
              <div className={gridClasses}>
                { Object.keys(attendee_count).map((key) => this.getUserDetails(attendee_count[key], key))}
              </div>
            </section>
            {debugInfo}
          </div>
        </div>
      </div>
    );
  }
}
