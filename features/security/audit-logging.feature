Feature: Admin Audit Logging
  As a system administrator
  I want all admin actions to be logged
  So that I can maintain accountability and track security events

  Background:
    Given I am logged in as an admin user

  @audit @security
  Scenario: Admin views user profile
    When I navigate to the admin users page
    And I view a user's profile
    Then an audit log entry should be created
    And the log should contain:
      | field        | value            |
      | action       | VIEW_PROFILE     |
      | target_table | profiles         |
      | admin_id     | current_admin_id |

  @audit @security
  Scenario: Admin modifies event registration
    Given an event registration exists
    When I update the event registration status
    Then an audit log entry should be created
    And the log should contain the old and new values

  @audit @security
  Scenario: Admin changes user role
    Given a user with role "user" exists
    When I change their role to "moderator"
    Then an audit log entry should be created
    And the log should contain:
      | field        | value      |
      | action       | UPDATE     |
      | target_table | user_roles |

  @audit @security
  Scenario: View audit logs
    When I navigate to the admin logs page
    Then I should see recent admin actions
    And each log entry should show:
      | admin_name  |
      | action      |
      | target      |
      | timestamp   |
