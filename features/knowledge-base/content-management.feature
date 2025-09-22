Feature: Knowledge Base Content Management
  As an admin user
  I want to manage knowledge base content
  So that I can maintain up-to-date learning materials

  Background:
    Given I am logged in as an admin user
    And I am on the Knowledge Base admin dashboard

  @smoke
  Scenario: Create a new knowledge item
    When I click on "Create New Item"
    And I fill in the basic information:
      | Field       | Value                    |
      | Title       | Test Knowledge Item      |
      | Description | Test description content |
      | Category    | Scrum Techniques         |
    And I add content to the rich text editor
    And I publish the knowledge item
    Then I should see "Knowledge item created successfully"
    And the item should appear in the knowledge base list

  Scenario: Edit existing knowledge item
    Given there is an existing knowledge item "Sample Item"
    When I click edit on "Sample Item"
    And I update the title to "Updated Sample Item"
    And I save the changes
    Then I should see "Knowledge item updated successfully"
    And the updated title should be displayed

  @bulk-operations
  Scenario: Bulk delete knowledge items
    Given I have multiple knowledge items selected
    When I click on the bulk delete button
    And I confirm the deletion
    Then I should see "Items deleted successfully"
    And the selected items should no longer appear in the list

  Scenario: Search and filter knowledge items
    Given there are knowledge items with different categories
    When I search for "Scrum"
    And I filter by "Techniques" category
    Then I should only see knowledge items matching the search and filter criteria