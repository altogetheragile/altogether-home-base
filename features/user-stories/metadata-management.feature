Feature: User Story Metadata Management
  As a product owner
  I want to manage rich metadata for user stories
  So that I can make better prioritization and planning decisions

  Background:
    Given I am logged in as an admin user
    And I have a user story "User Login Feature"

  @metadata @smoke
  Scenario: View story metadata panel
    Given I am viewing the story details
    When I click on the story card
    Then I should see a metadata panel with 4 tabs
    And the tabs should be "Overview", "Details", "Readiness", "Technical"

  @metadata @overview
  Scenario: View overview metadata
    When I open the metadata panel
    And I select the "Overview" tab
    Then I should see the user_persona
    And I should see the business_objective
    And I should see the user_value
    And I should see the confidence_level badge
    And I should see the estimated_effort_hours

  @metadata @details
  Scenario: View detailed metadata
    When I open the metadata panel
    And I select the "Details" tab
    Then I should see the business_value_score
    And I should see the technical_complexity_score
    And I should see the impact vs effort matrix
    And I should see the dependencies list
    And I should see the risks list

  @metadata @readiness
  Scenario: Manage Definition of Ready
    When I open the metadata panel
    And I select the "Readiness" tab
    Then I should see the Definition of Ready checklist
    And I should see 5 default DoR items
    When I check the first DoR item
    Then the readiness score should update
    And the story card should reflect the new readiness percentage

  @metadata @technical
  Scenario: View technical metadata
    When I open the metadata panel
    And I select the "Technical" tab
    Then I should see the technical_notes
    And I should see the dependencies
    And I should see the risks
    And I should see the acceptance_criteria list

  @metadata @edit
  Scenario: Edit story metadata
    Given I have opened the story editor
    When I update the user_persona to "Premium User"
    And I update the business_value_score to 9
    And I update the technical_complexity_score to 4
    And I click "Save"
    Then the story should be updated with new metadata
    And the metadata panel should show the updated values

  @metadata @impact-effort
  Scenario: Visualize impact vs effort matrix
    Given I have multiple stories with different scores
    When I view the impact vs effort matrix
    Then stories should be plotted based on business_value_score and technical_complexity_score
    And high-value low-complexity stories should be in the top-left quadrant
    And low-value high-complexity stories should be in the bottom-right quadrant

  @metadata @confidence
  Scenario Outline: Display confidence level badges
    Given a story has confidence_level of <level>
    When I view the story card
    Then the confidence badge should show "<label>"
    And the badge color should be "<color>"

    Examples:
      | level | label      | color       |
      | 1     | Very Low   | destructive |
      | 2     | Low        | secondary   |
      | 3     | Medium     | default     |
      | 4     | High       | default     |
      | 5     | Very High  | default     |

  @metadata @dor-dod
  Scenario: Complete all DoR items
    Given I have a story with incomplete DoR
    When I check all DoR items
    Then the readiness score should be 100%
    And the story status should update to "Ready"
    And a success toast should appear

  @metadata @dor-dod
  Scenario: Track DoD completion during development
    Given I have a story "In Progress"
    And the story has 6 DoD items
    When I complete "Code is written and reviewed"
    And I complete "Unit tests pass"
    Then the completion score should be 33%
    When I complete all remaining DoD items
    Then the completion score should be 100%
    And the story status should update to "Done"

  @metadata @validation
  Scenario: Validate metadata constraints
    Given I am editing a story
    When I try to set business_value_score to 11
    Then I should see a validation error "Score must be between 1 and 10"
    When I try to set confidence_level to 6
    Then I should see a validation error "Confidence level must be between 1 and 5"
    When I try to set estimated_effort_hours to -5
    Then I should see a validation error "Hours must be positive"

  @metadata @bulk-update
  Scenario: Bulk update story metadata
    Given I have selected 5 user stories
    When I click "Bulk Edit Metadata"
    And I set user_persona to "Enterprise Admin"
    And I set business_objective to "Improve efficiency"
    And I click "Apply to Selected"
    Then all 5 stories should have the updated metadata
    And a success toast should confirm "5 stories updated"
