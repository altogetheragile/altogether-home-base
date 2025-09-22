Feature: Knowledge Item Editor
  As a content creator
  I want to create and edit knowledge items with rich content
  So that I can produce comprehensive learning materials

  Background:
    Given I am logged in as an admin user

  @editor-workflow
  Scenario: Complete knowledge item creation workflow
    Given I am on the knowledge item creation page
    When I fill in the basic information step:
      | Field       | Value                           |
      | Title       | Advanced Scrum Planning         |
      | Description | Comprehensive planning guide    |
    And I proceed to the content step
    And I add rich text content with formatting
    And I proceed to the classification step
    And I select category "Scrum Techniques"
    And I add tags "planning, scrum, agile"
    And I proceed to the publication step
    And I set the status to "Published"
    Then I should see "Knowledge item created successfully"

  @rich-text-editor
  Scenario: Use rich text editor features
    Given I am editing a knowledge item
    When I add a heading "Main Concept"
    And I add a bulleted list with three items
    And I insert a link to "https://example.com"
    And I upload an image to the content
    And I save the content
    Then the content should be saved with all formatting preserved

  @template-usage
  Scenario: Create item from template
    Given I am on the knowledge item creation page
    When I click "Use Template"
    And I select "Scrum Process Template"
    Then the form should be pre-filled with template content
    And I should be able to customize the template content
    When I save the item
    Then it should be created with the template structure

  @live-preview
  Scenario: Use live preview feature
    Given I am editing knowledge item content
    When I add content to the editor
    Then I should see the content rendered in the live preview panel
    When I change the content formatting
    Then the preview should update in real-time