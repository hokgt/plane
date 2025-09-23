from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction

from plane.db.models import Workspace, WorkspaceMember, User
from plane.app.permissions.workspace import WorkspaceOwnerPermission


@api_view(['POST'])
@permission_classes([IsAuthenticated, WorkspaceOwnerPermission])
def remove_manager(request, workspace_slug, member_id):
    """
    Remove manager role from a user (only admins can do this)
    """
    try:
        # Get the workspace
        workspace = get_object_or_404(Workspace, slug=workspace_slug)
        
        # Get the member to remove manager role from
        member = get_object_or_404(WorkspaceMember, id=member_id, workspace=workspace)
        
        # Check if the current user is owner or manager
        if not (request.user.is_owner() or request.user.is_manager()):
            return Response(
                {"error": "Only owners and managers can remove managers"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if the member is actually a manager
        if member.role != 15:  # 15 is manager role
            return Response(
                {"error": "User is not a manager"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the user's role to staff
        with transaction.atomic():
            # Update workspace member role to staff (10)
            member.role = 10
            member.save()
            
            # Update user's system role to staff
            member.member.user_role = 'staff'
            member.member.save()
        
        return Response(
            {"message": "Manager role removed successfully"}, 
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
