# Third party imports
from rest_framework import serializers

# Module imports
from plane.app.serializers.base import BaseSerializer
from plane.db.models import Company, CompanyUser, User


class CompanyLiteSerializer(BaseSerializer):
    """Lightweight company serializer for basic company information"""
    
    class Meta:
        model = Company
        fields = [
            "id",
            "name", 
            "slug",
            "description",
            "is_active",
            "max_users",
            "primary_color",
            "logo_url",
            "created_at",
            "updated_at"
        ]
        read_only_fields = [
            "id",
            "created_at", 
            "updated_at"
        ]


class CompanySerializer(BaseSerializer):
    """Full company serializer with manager information"""
    
    manager_email = serializers.EmailField(source='manager.email', read_only=True)
    manager_display_name = serializers.CharField(source='manager.display_name', read_only=True)
    current_user_count = serializers.SerializerMethodField()
    can_add_users = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "slug", 
            "description",
            "is_active",
            "max_users",
            "primary_color",
            "logo",
            "logo_asset",
            "logo_url",
            "manager",
            "manager_email",
            "manager_display_name",
            "current_user_count",
            "can_add_users",
            "created_at",
            "updated_at"
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "logo_url",
            "manager_email",
            "manager_display_name",
            "current_user_count",
            "can_add_users"
        ]
    
    def get_current_user_count(self, obj):
        """Get current number of users in company"""
        return obj.get_user_count()
    
    def get_can_add_users(self, obj):
        """Check if company can add more users"""
        return obj.can_add_user()


class CompanyUserSerializer(BaseSerializer):
    """Serializer for company user relationships"""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_display_name = serializers.CharField(source='user.display_name', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_avatar = serializers.CharField(source='user.avatar_url', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = CompanyUser
        fields = [
            "id",
            "company",
            "user",
            "role",
            "is_active",
            "joined_at",
            "company_display_name",
            "company_role_title",
            "user_email",
            "user_display_name", 
            "user_first_name",
            "user_last_name",
            "user_avatar",
            "company_name",
            "created_at",
            "updated_at"
        ]
        read_only_fields = [
            "id",
            "joined_at",
            "created_at",
            "updated_at",
            "user_email",
            "user_display_name",
            "user_first_name", 
            "user_last_name",
            "user_avatar",
            "company_name"
        ]


class CompanyUserCreateSerializer(serializers.Serializer):
    """Serializer for creating company user relationships"""
    
    email = serializers.EmailField(required=True)
    display_name = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(
        choices=CompanyUser.COMPANY_ROLE_CHOICES,
        default='staff'
    )
    company_role_title = serializers.CharField(required=False, allow_blank=True)
    
    def validate_email(self, value):
        """Validate email is not already in company"""
        company = self.context.get('company')
        if company:
            existing_user = CompanyUser.objects.filter(
                company=company,
                user__email=value,
                is_active=True,
                deleted_at__isnull=True
            ).exists()
            if existing_user:
                raise serializers.ValidationError("User already exists in this company")
        return value


class CompanyCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating companies"""
    
    class Meta:
        model = Company
        fields = [
            "name",
            "description", 
            "max_users",
            "primary_color",
            "logo",
            "logo_asset"
        ]
    
    def create(self, validated_data):
        """Create company with current user as manager"""
        user = self.context['request'].user
        validated_data['manager'] = user
        
        # Generate slug from name
        name = validated_data['name']
        base_slug = name.lower().replace(' ', '-').replace('_', '-')
        slug = base_slug
        
        # Ensure slug is unique
        counter = 1
        while Company.objects.filter(slug=slug, deleted_at__isnull=True).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        validated_data['slug'] = slug
        
        company = Company.objects.create(**validated_data)
        
        # Add manager as company user
        CompanyUser.objects.create(
            company=company,
            user=user,
            role='manager',
            is_active=True
        )
        
        return company


class CompanyUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating companies"""
    
    class Meta:
        model = Company
        fields = [
            "name",
            "description",
            "is_active", 
            "max_users",
            "primary_color",
            "logo",
            "logo_asset"
        ]
    
    def update(self, instance, validated_data):
        """Update company with slug regeneration if name changes"""
        if 'name' in validated_data and validated_data['name'] != instance.name:
            # Regenerate slug if name changes
            name = validated_data['name']
            base_slug = name.lower().replace(' ', '-').replace('_', '-')
            slug = base_slug
            
            counter = 1
            while Company.objects.filter(slug=slug, deleted_at__isnull=True).exclude(id=instance.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            validated_data['slug'] = slug
        
        return super().update(instance, validated_data)

