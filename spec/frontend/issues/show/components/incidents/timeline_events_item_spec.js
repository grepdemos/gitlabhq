import timezoneMock from 'timezone-mock';
import { GlIcon, GlDropdown, GlBadge } from '@gitlab/ui';
import { nextTick } from 'vue';
import { timelineItemI18n } from '~/issues/show/components/incidents/constants';
import { mountExtended } from 'helpers/vue_test_utils_helper';
import IncidentTimelineEventItem from '~/issues/show/components/incidents/timeline_events_item.vue';
import { mockEvents } from './mock_data';

describe('IncidentTimelineEventList', () => {
  let wrapper;

  const mountComponent = ({ propsData, provide } = {}) => {
    const { action, noteHtml, occurredAt } = mockEvents[0];
    wrapper = mountExtended(IncidentTimelineEventItem, {
      propsData: {
        action,
        noteHtml,
        occurredAt,
        ...propsData,
      },
      provide: {
        canUpdateTimelineEvent: false,
        ...provide,
      },
    });
  };

  const findCommentIcon = () => wrapper.findComponent(GlIcon);
  const findEventTime = () => wrapper.findByTestId('event-time');
  const findEventTags = () => wrapper.findAllComponents(GlBadge);
  const findDropdown = () => wrapper.findComponent(GlDropdown);
  const findDeleteButton = () => wrapper.findByText(timelineItemI18n.delete);

  describe('template', () => {
    beforeEach(() => {
      mountComponent();
    });

    it('shows comment icon', () => {
      expect(findCommentIcon().exists()).toBe(true);
    });

    it('sets correct props for icon', () => {
      expect(findCommentIcon().props('name')).toBe(mockEvents[0].action);
    });

    it('displays the correct time', () => {
      expect(findEventTime().text()).toBe('15:59 UTC');
    });

    describe.each`
      timezone
      ${'Europe/London'}
      ${'US/Pacific'}
      ${'Australia/Adelaide'}
    `('when viewing in timezone', ({ timezone }) => {
      describe(timezone, () => {
        beforeEach(() => {
          timezoneMock.register(timezone);
        });

        afterEach(() => {
          timezoneMock.unregister();
        });

        it('displays the correct time', () => {
          expect(findEventTime().text()).toBe('15:59 UTC');
        });
      });
    });

    describe.each([
      { eventTags: [], expected: 0 },
      { eventTags: ['Start time'], expected: 1 },
      { eventTags: ['Start time', 'End time'], expected: 2 },
    ])('timeline event tags', ({ eventTags, expected }) => {
      it(`shows ${expected} badges when ${expected} tags are provided`, () => {
        mountComponent({ propsData: { eventTags } });

        expect(findEventTags().exists()).toBe(Boolean(expected));
        expect(findEventTags().length).toBe(eventTags.length);
      });
    });

    describe('action dropdown', () => {
      it('does not show the action dropdown by default', () => {
        expect(findDropdown().exists()).toBe(false);
        expect(findDeleteButton().exists()).toBe(false);
      });

      it('shows dropdown and delete item when user has update permission', () => {
        mountComponent({ provide: { canUpdateTimelineEvent: true } });

        expect(findDropdown().exists()).toBe(true);
        expect(findDeleteButton().exists()).toBe(true);
      });

      it('triggers a delete when the delete button is clicked', async () => {
        mountComponent({ provide: { canUpdateTimelineEvent: true } });

        findDeleteButton().trigger('click');

        await nextTick();

        expect(wrapper.emitted().delete).toHaveLength(1);
      });
    });
  });
});
