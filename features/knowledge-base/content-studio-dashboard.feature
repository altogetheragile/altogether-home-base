Feature: Content Studio Dashboard
  As an admin user
  I want to view and manage content through the dashboard
  So that I can efficiently oversee all knowledge base activities

  Background:
    Given I am logged in as an admin user
    And I am on the Content Studio Dashboard

  @analytics
  Scenario: View content analytics
    When I navigate to the analytics section
    Then I should see the total number of knowledge items
    And I should see the number of published items
    And I should see the number of draft items
    And I should see view statistics

  @dashboard-navigation
  Scenario: Navigate between dashboard views
    When I switch to "Cards" view
    Then I should see knowledge items displayed as cards
    When I switch to "Table" view
    Then I should see knowledge items displayed in a table format
    When I switch to "Board" view
    Then I should see knowledge items organized by status columns

  @content-filtering
  Scenario: Apply advanced filters
    When I open the filters panel
    And I select "Published" status filter
    And I select "Scrum Techniques" category
    And I set date range to "Last 30 days"
    Then I should see only items matching all filter criteria
    And the item count should reflect the filtered results

  @bulk-operations-dashboard
  Scenario: Perform bulk operations from dashboard
    Given I have selected multiple knowledge items
    When I choose "Change Category" from bulk operations
    And I select "Agile Methodologies" as the new category
    Then all selected items should be updated to the new category
    And I should see a success confirmation