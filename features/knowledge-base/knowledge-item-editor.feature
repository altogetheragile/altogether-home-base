Feature: Knowledge Item Editor
  As an admin user
  I want to use the knowledge item editor
  So that I can create and edit knowledge items with all necessary details

  Background:
    Given I am logged in as an admin user

  @editor
  Scenario: Navigate through editor steps
    Given I open the knowledge item editor
    When I am on the "Basic Information" step
    Then I should see fields for name, description, and summary
    When I click "Next" to go to "Content" step
    Then I should see the rich text editor for content
    When I click "Next" to go to "Classification" step
    Then I should see category and tag selection fields
    When I click "Next" to go to "Use Cases" step
    Then I should see use case management interface

  @editor @validation
  Scenario: Basic information validation
    Given I open the knowledge item editor
    When I try to proceed without entering a name
    Then I should see a validation error for the name field
    And I should not be able to proceed to the next step
    When I enter a name "Test Knowledge Item"
    And I enter a description "Test description"
    Then I should be able to proceed to the next step

  @editor @content
  Scenario: Add rich content using the editor
    Given I open the knowledge item editor
    And I complete the basic information step
    When I am on the "Content" step
    And I add formatted text with headings and lists
    And I insert an image into the content
    And I add a link to external resource
    Then the content should be properly formatted in the preview
    And all formatting should be preserved

  @editor @classification
  Scenario: Classify knowledge item
    Given I open the knowledge item editor
    And I complete the basic information and content steps
    When I am on the "Classification" step
    And I select "Agile Frameworks" as the category
    And I select "Intermediate" as the level
    And I add tags "scrum, agile, framework"
    And I select "Team Management" as the planning focus
    Then all classification data should be saved with the item

  @editor @use-cases
  Scenario: Add use cases to knowledge item
    Given I open the knowledge item editor
    And I complete previous steps
    When I am on the "Use Cases" step
    And I click "Add Use Case"
    And I fill in the use case details:
      | Field       | Value                           |
      | Title       | Sprint Planning Meeting         |
      | Description | Use this for sprint planning    |
      | Context     | When starting a new sprint      |
      | Outcome     | Well-planned sprint backlog     |
    Then the use case should be added to the list
    And I should be able to add more use cases

  @editor @templates
  Scenario: Apply template to knowledge item
    Given I open the knowledge item editor
    When I click on "Apply Template"
    And I select "Agile Ceremony Template"
    Then the knowledge item should be populated with template content
    And I should see template-specific fields
    And I should be able to customize the template content

  @editor @save
  Scenario: Save knowledge item as draft
    Given I have filled out a knowledge item in the editor
    When I click "Save as Draft"
    Then the item should be saved with draft status
    And I should see a success message
    And I should be able to continue editing later

  @editor @publish
  Scenario: Publish knowledge item
    Given I have a complete knowledge item in the editor
    When I click "Publish"
    Then the item should be saved with published status
    And it should appear in the public knowledge base
    And I should see a success message

  @editor @preview
  Scenario: Preview knowledge item
    Given I am editing a knowledge item
    When I click the "Preview" button
    Then I should see how the item will appear to end users
    And all formatting and content should display correctly
    And I should be able to return to editing mode

  @editor @validation
  Scenario: Required fields validation before publishing
    Given I am editing a knowledge item
    When I try to publish without completing required fields
    Then I should see validation errors highlighting missing fields
    And the publish action should be prevented
    And I should see guidance on what needs to be completed

  @editor @autosave
  Scenario: Auto-save functionality
    Given I am editing a knowledge item
    When I make changes to the content
    And I wait for a few seconds
    Then the changes should be automatically saved as draft
    And I should see an "Auto-saved" indicator