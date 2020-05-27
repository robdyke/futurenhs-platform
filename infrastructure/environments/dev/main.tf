provider "azurerm" {
  version = "=2.11.0"
  features {}
}

provider "random" {
  version = "~> 2.2"
}

terraform {
  required_version = "0.12.25"
  backend "azurerm" {
    resource_group_name  = "tfstate${var.USERNAME}"
    storage_account_name = "tfstate${var.USERNAME}"
    container_name       = "tfstate"
    key                  = "dev.terraform.tfstate"
  }
}
