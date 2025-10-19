Feature: AI-Powered User Story Generation
  As a product owner
  I want to generate user stories using AI
  So that I can quickly create well-structured requirements

  Background:
    Given I am logged in as an admin user
    And I am on the project canvas page

  @smoke @ai-generation
  Scenario: Generate a user story from text input
    Given I have a project with no stories
    When I click the "Generate with AI" button
    And I select story level "User Story"
    And I enter the description "User wants to log in with email and password"
    And I click "Generate"
    Then I should see a loading indicator
    And the story should be generated within 10 seconds
    And the generated story should have a title
    And the generated story should have a description
    And the generated story should have acceptance criteria
    And the generated story should have a confidence level

  @ai-generation
  Scenario: Generate an epic with business context
    Given I have a project with no epics
    When I click the "Generate with AI" button
    And I select story level "Epic"
    And I enter the description "Complete user management system"
    And I enter business objective "Streamline user administration"
    And I enter user persona "System Administrator"
    And I click "Generate"
    Then the generated epic should include business_objective
    And the generated epic should include success_metrics
    And the generated epic should have estimated effort hours

  @ai-generation @metadata
  Scenario: Generate story with enhanced metadata
    Given I have a project
    When I generate a user story with AI
    Then the story should include "Definition of Ready" items
    And the story should include "Definition of Done" items
    And the story should include technical_notes
    And the story should include dependencies list
    And the story should include risks list
    And the story should include business_value_score
    And the story should include technical_complexity_score
    And the story should include estimated_effort_hours

  @ai-generation @parent-context
  Scenario: Generate feature within an epic
    Given I have an epic "User Management System"
    When I click "Generate Feature" within the epic
    And I enter the description "User registration with email verification"
    And I click "Generate"
    Then the generated feature should reference the parent epic
    And the feature should align with the epic's business objective
    And the feature should have appropriate scope for a feature

  @ai-generation @error-handling
  Scenario: Handle rate limit exceeded
    Given I have generated 50 stories in the last hour
    When I try to generate another story
    Then I should see an error message "Rate limit exceeded"
    And the error should indicate when I can retry
    And no story should be created

  @ai-generation @error-handling
  Scenario: Handle invalid input
    When I click the "Generate with AI" button
    And I leave the description field empty
    And I click "Generate"
    Then I should see a validation error
    And no API call should be made

  @ai-generation @audit
  Scenario: Audit trail for AI generation
    Given I am an admin user
    When I generate a user story with AI
    Then the generation should be logged in the audit table
    And the audit log should include user_id
    And the audit log should include input_data
    And the audit log should include output_data
    And the audit log should include token_count
    And the audit log should include execution_time_ms

  @ai-generation @confidence
  Scenario Outline: Generate stories with different confidence levels
    When I generate a story for "<story_type>"
    Then the confidence level should be appropriate for the complexity
    And the confidence badge should display the correct color

    Examples:
      | story_type                          |
      | Simple UI text change               |
      | Standard CRUD operation             |
      | Complex integration with third-party|
      | Novel AI-powered feature            |

  @ai-generation @readiness
  Scenario: Track story readiness with DoR
    Given I have generated a user story
    When I view the story metadata
    Then I should see the Definition of Ready checklist
    And each DoR item should be checkable
    When I check 3 out of 5 DoR items
    Then the readiness score should show 60%
    And the story should show as "Partially Ready"

  @ai-generation @completion
  Scenario: Track story completion with DoD
    Given I have a story in progress
    When I view the story metadata
    Then I should see the Definition of Done checklist
    And each DoD item should be checkable
    When I check 4 out of 6 DoD items
    Then the completion score should show 67%
    And the story should show as "In Progress"
