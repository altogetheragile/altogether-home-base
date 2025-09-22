Feature: Content Studio Dashboard
  As an admin user
  I want to use the content studio dashboard
  So that I can efficiently manage and organize knowledge content

  Background:
    Given I am logged in as an admin user
    And I am on the content studio dashboard

  @dashboard
  Scenario: Switch between different view modes
    Given I am on the content studio dashboard
    When I click on the "Cards" view button
    Then I should see knowledge items displayed as cards
    When I click on the "Table" view button
    Then I should see knowledge items displayed in a table
    When I click on the "Kanban" view button
    Then I should see knowledge items organized in columns by status

  @dashboard
  Scenario: Use the command palette
    Given I am on the content studio dashboard
    When I press "Ctrl+K" or "Cmd+K"
    Then the command palette should open
    When I type "create"
    Then I should see create options in the command palette
    When I select "Create Knowledge Item"
    Then the knowledge item editor should open

  @sidebar
  Scenario: Navigate using the sidebar workflow
    Given I am on the content studio dashboard
    When I click on "Draft" in the sidebar
    Then I should see only draft knowledge items
    When I click on "Published" in the sidebar
    Then I should see only published knowledge items
    When I click on "All Items" in the sidebar
    Then I should see all knowledge items regardless of status

  @filters
  Scenario: Apply quick filters from sidebar
    Given I am on the content studio dashboard
    When I click on "Recent Updates" in the sidebar
    Then I should see knowledge items sorted by most recently updated
    When I click on "Most Popular" in the sidebar  
    Then I should see knowledge items sorted by popularity/views
    When I click on "Needs Review" in the sidebar
    Then I should see knowledge items that need review

  @search
  Scenario: Use advanced search and filters
    Given I am on the content studio dashboard
    When I click on the search bar
    And I enter "agile scrum" in the search field
    And I select "Agile Frameworks" from the category filter
    And I select "Published" from the status filter
    Then I should see filtered results matching all criteria
    And the active filters should be displayed as chips

  @sorting
  Scenario: Sort knowledge items
    Given I am on the content studio dashboard
    And there are multiple knowledge items visible
    When I click on the sort dropdown
    And I select "Alphabetical"
    Then the knowledge items should be sorted alphabetically by name
    When I select "Most Recent"
    Then the knowledge items should be sorted by last updated date
    When I select "Most Popular"
    Then the knowledge items should be sorted by view count

  @analytics
  Scenario: View content analytics
    Given I am on the content studio dashboard
    When I click on the "Analytics" view button
    Then I should see content analytics dashboard
    And I should see metrics like total items, views, and engagement
    And I should see charts showing content performance over time

  @responsive
  Scenario: Use dashboard on mobile device
    Given I am on the content studio dashboard
    And I am using a mobile device
    Then the sidebar should be collapsible
    And the view should be optimized for mobile
    And all main functions should remain accessible