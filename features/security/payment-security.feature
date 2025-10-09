Feature: Payment Data Security
  As a system administrator
  I want payment data to be properly secured
  So that financial information is protected

  Background:
    Given I am logged in as a regular user
    And an event with registration exists

  @security @payment
  Scenario: Users cannot modify payment status directly
    Given I have a registration with status "unpaid"
    When I try to update the payment_status to "paid" directly
    Then the update should be rejected
    And the payment_status should remain "unpaid"

  @security @payment
  Scenario: Payment status updated only through Stripe webhook
    Given I have a registration with status "unpaid"
    When the Stripe payment webhook is triggered
    And the payment is verified as successful
    Then the payment_status should be updated to "paid"

  @security @audit @payment
  Scenario: Payment modifications are logged
    Given I am logged in as an admin user
    And a registration exists
    When an admin updates the registration
    Then an audit log entry should be created
    And the log should capture payment-related changes

  @security @payment
  Scenario: Admins can view payment status
    Given I am logged in as an admin user
    When I view event registrations
    Then I should see payment status for all registrations
    And I should be able to filter by payment status
