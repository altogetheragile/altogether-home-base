Feature: Knowledge Base Content Management
  As an admin user
  I want to manage knowledge base content
  So that I can create, update, and organize knowledge items effectively

  Background:
    Given I am logged in as an admin user
    And I am on the knowledge base admin page

  @smoke
  Scenario: View knowledge base dashboard
    When I visit the knowledge base admin page
    Then I should see the content studio dashboard
    And I should see the navigation sidebar
    And I should see knowledge items listed

  @crud
  Scenario: Create a new knowledge item
    Given I am on the knowledge base admin page
    When I click the "Create New" button
    And I fill in the basic information:
      | Field       | Value                    |
      | Name        | Test Knowledge Item      |
      | Description | This is a test item      |
      | Category    | Agile Frameworks         |
    And I add content to the knowledge item
    And I click "Save"
    Then I should see a success message
    And the knowledge item should appear in the list

  @crud
  Scenario: Edit an existing knowledge item
    Given there is a knowledge item named "Existing Item"
    When I click on the "Existing Item" knowledge item
    And I click the edit button
    And I change the name to "Updated Item"
    And I save the changes
    Then I should see "Updated Item" in the knowledge items list
    And I should see a success message

  @crud
  Scenario: Delete a knowledge item
    Given there is a knowledge item named "Item to Delete"
    When I select the "Item to Delete" knowledge item
    And I click the delete button
    And I confirm the deletion
    Then the "Item to Delete" should not appear in the list
    And I should see a success message

  @search
  Scenario: Search for knowledge items
    Given there are multiple knowledge items in the system
    When I enter "Scrum" in the search field
    Then I should see only knowledge items containing "Scrum"
    And the search results should be highlighted

  @filter
  Scenario: Filter knowledge items by category
    Given there are knowledge items in different categories
    When I select "Agile Frameworks" from the category filter
    Then I should see only knowledge items in the "Agile Frameworks" category
    And the filter should show as active

  @filter
  Scenario: Filter knowledge items by status
    Given there are both published and draft knowledge items
    When I select "Published" from the status filter
    Then I should see only published knowledge items
    And draft items should not be visible

  @bulk
  Scenario: Bulk delete knowledge items
    Given I have multiple knowledge items selected
    When I click the bulk operations menu
    And I select "Delete Selected"
    And I confirm the bulk deletion
    Then all selected items should be removed from the list
    And I should see a success message indicating the number of deleted items

  @validation
  Scenario: Validation when creating knowledge item without required fields
    Given I am on the knowledge base admin page
    When I click the "Create New" button
    And I click "Save" without filling required fields
    Then I should see validation error messages
    And the knowledge item should not be created